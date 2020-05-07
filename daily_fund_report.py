#!winpty python
#-*- coding: utf-8 -*

class Unbuffered(object):
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
   def writelines(self, datas):
       self.stream.writelines(datas)
       self.stream.flush()
   def __getattr__(self, attr):
       return getattr(self.stream, attr)

from datetime import datetime, timedelta
import sys, os, http.client, json, time, winsound

sys.stdout = Unbuffered(sys.stdout)

to_date = datetime.today()
from_date = to_date - timedelta(days=14) # 14 days back is long enough for long public holidays close.

fund_conn = http.client.HTTPConnection('www.fullgoal.com.cn', timeout=5)

while True:
  try:
    fund_conn.request("GET", "/chart-web/chart/fundnetchart!getFundNetChartJson"
                             "?fundcode=001510&from=%s&to=%s&charttype=2&show=1"
                             "&titleflag=1&siteId=ea9e215cce3342d3b40721461cd1572d"
                             % (from_date.strftime('%Y-%m-%d'), to_date.strftime('%Y-%m-%d')))
    resp_c = json.loads(fund_conn.getresponse().read())

    # if the last net value is today's (within 1 day), it means we get the update.
    if timedelta(days=1) > (to_date - datetime.strptime(resp_c['xAxisData'][-1], '%Y-%m-%d')):
        print('\n>>> Eureka! <<<')
        fund_conn.request("GET", "/chart-web/chart/fundnetchart!getFundNetChartJson"
                                 "?fundcode=001508&from=%s&to=%s&charttype=2&show=1"
                                 "&titleflag=1&siteId=ea9e215cce3342d3b40721461cd1572d"
                                 % (from_date.strftime('%Y-%m-%d'), to_date.strftime('%Y-%m-%d')))
        resp_a = json.loads(fund_conn.getresponse().read())
        break
    #else:
        #print(resp_c)

    print('.', end='')
    time.sleep(60)
  except RemoteDisconnected:
    print('_', end='')
    time.sleep(120)

value_today    = float(resp_a['seriesData0'][-1])
value_yestoday = float(resp_a['seriesData0'][-2])
daily_adjustment = (value_today - value_yestoday) / value_yestoday * 100
print("[%s] %.4f -> %.4f  富国新动力A -> 日涨跌: %.4f%%"
      % (to_date, value_yestoday, value_today, daily_adjustment))

value_today    = float(resp_c['seriesData0'][-1])
value_yestoday = float(resp_c['seriesData0'][-2])
daily_adjustment = (value_today - value_yestoday) / value_yestoday * 100
print("[%s] %.4f -> %.4f  富国新动力C -> 日涨跌: %.4f%%"
      % (to_date, value_yestoday, value_today, daily_adjustment))

winsound.MessageBeep()
