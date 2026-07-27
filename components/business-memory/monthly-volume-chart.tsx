"use client";

import {useEffect,useRef} from "react";
import * as echarts from "echarts/core";
import {BarChart,LineChart} from "echarts/charts";
import {GridComponent,LegendComponent,TooltipComponent} from "echarts/components";
import {CanvasRenderer} from "echarts/renderers";
import type {BusinessObservationSnapshot} from "@/lib/domain/business-observation";

echarts.use([BarChart,LineChart,GridComponent,LegendComponent,TooltipComponent,CanvasRenderer]);

const palette = ["#5f93ab","#83afbf","#a6c5cc","#789aa9","#b8ced0","#4f7487"];

export function MonthlyVolumeChart({months,trendLabel}: {months:BusinessObservationSnapshot["monthlyTransactions"];trendLabel:string}) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current,undefined,{renderer:"canvas"});
    const visible = months.slice(-24);
    const services = [...new Set(visible.flatMap((month) => month.services.map((service) => service.name)))];
    const rolling = visible.map((_,index) => {
      const window = visible.slice(Math.max(0,index - 2),index + 1);
      return Number((window.reduce((sum,month) => sum + month.total,0) / window.length).toFixed(1));
    });
    chart.setOption({
      animationDuration:700,
      color:palette,
      grid:{left:12,right:18,top:services.length > 1 ? 52 : 26,bottom:28,containLabel:true},
      legend:{show:services.length > 1,top:0,left:0,itemWidth:9,itemHeight:9,itemGap:16,textStyle:{color:"#667d89",fontSize:10}},
      tooltip:{trigger:"axis",backgroundColor:"rgba(250,252,251,.96)",borderColor:"rgba(121,157,171,.28)",textStyle:{color:"#243b48",fontSize:11},extraCssText:"box-shadow:0 14px 42px rgba(57,88,102,.12);border-radius:12px"},
      xAxis:{type:"category",data:visible.map((month) => month.month.replace("-",".")),axisLine:{lineStyle:{color:"rgba(121,157,171,.25)"}},axisTick:{show:false},axisLabel:{color:"#82959e",fontSize:9,interval:visible.length > 14 ? 1 : 0}},
      yAxis:{type:"value",minInterval:1,splitLine:{lineStyle:{color:"rgba(121,157,171,.12)"}},axisLabel:{color:"#82959e",fontSize:9}},
      series:[
        ...services.map((name,index) => ({name,type:"bar" as const,stack:"volume",barMaxWidth:30,itemStyle:{color:palette[index % palette.length],borderRadius:index === services.length - 1 ? [5,5,0,0] : 0},emphasis:{focus:"series" as const},data:visible.map((month) => month.services.find((service) => service.name === name)?.count ?? 0)})),
        {name:trendLabel,type:"line" as const,smooth:.32,symbol:"none",lineStyle:{width:2,color:"#294f62"},data:rolling,z:5},
      ],
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartRef.current);
    return () => {observer.disconnect(); chart.dispose();};
  },[months,trendLabel]);

  return <div ref={chartRef} className="notebook-volume-echart" role="img" aria-label={trendLabel}/>;
}
