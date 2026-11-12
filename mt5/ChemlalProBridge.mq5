//+------------------------------------------------------------------+
//| CHEMLAL PRO - MT5 Live Bridge                                    |
//| Sends broker Bid/Ask and recent OHLC candles to the private app. |
//+------------------------------------------------------------------+
#property strict
#property version "1.00"
input string BridgeURL = "https://traderprochemlalv2.vercel.app/api/bridge";
input string BridgeSecret = "SET_THE_SAME_CHEMLAL_BRIDGE_SECRET";
input int UpdateSeconds = 2;
input int CandleCount = 80;

string EscapeJson(string value) {
   StringReplace(value, "\\", "\\\\");
   StringReplace(value, "\"", "\\\"");
   return value;
}
string BarsJson(string symbol, ENUM_TIMEFRAMES timeframe) {
   MqlRates rates[];
   ArraySetAsSeries(rates, false);
   int copied = CopyRates(symbol, timeframe, 0, CandleCount, rates);
   string out = "[";
   for(int i=0; i<copied; i++) {
      if(i>0) out += ",";
      out += "{\"time\":" + IntegerToString((long)rates[i].time);
      out += ",\"open\":" + DoubleToString(rates[i].open, 8);
      out += ",\"high\":" + DoubleToString(rates[i].high, 8);
      out += ",\"low\":" + DoubleToString(rates[i].low, 8);
      out += ",\"close\":" + DoubleToString(rates[i].close, 8) + "}";
   }
   return out + "]";
}
void SendSnapshot() {
   string symbol = _Symbol;
   MqlTick tick;
   if(!SymbolInfoTick(symbol, tick)) return;
   string body = "{\"symbol\":\"" + EscapeJson(symbol) + "\"";
   body += ",\"bid\":" + DoubleToString(tick.bid, _Digits);
   body += ",\"ask\":" + DoubleToString(tick.ask, _Digits);
   body += ",\"time\":" + IntegerToString((long)tick.time);
   body += ",\"candles\":{";
   body += "\"M5\":" + BarsJson(symbol, PERIOD_M5);
   body += ",\"M15\":" + BarsJson(symbol, PERIOD_M15);
   body += ",\"H1\":" + BarsJson(symbol, PERIOD_H1);
   body += ",\"H4\":" + BarsJson(symbol, PERIOD_H4) + "}}";
   char data[], result[];
   StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(data, ArraySize(data)-1);
   string headers = "Content-Type: application/json\r\nX-Bridge-Secret: " + BridgeSecret + "\r\n";
   string responseHeaders;
   ResetLastError();
   int code = WebRequest("POST", BridgeURL, headers, 5000, data, result, responseHeaders);
   if(code != 200) Print("CHEMLAL PRO bridge POST failed. HTTP=", code, " error=", GetLastError(), " response=", CharArrayToString(result));
}
int OnInit() {
   if(BridgeSecret == "" || BridgeSecret == "SET_THE_SAME_CHEMLAL_BRIDGE_SECRET") {
      Print("Set BridgeSecret before enabling the EA.");
      return INIT_PARAMETERS_INCORRECT;
   }
   EventSetTimer(MathMax(1, UpdateSeconds));
   SendSnapshot();
   return INIT_SUCCEEDED;
}
void OnDeinit(const int reason) { EventKillTimer(); }
void OnTimer() { SendSnapshot(); }
void OnTick() { SendSnapshot(); }
