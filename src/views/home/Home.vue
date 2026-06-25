<template>
  <div class="home-page">
    <el-card class="home-card">
      <div class="home-header">
        <h1 class="home-title">欢迎使用设备预约管理系统</h1>
      </div>
      
      <div class="charts-container">
        <div class="chart-wrapper">
          <div class="chart-header">
            <h2 class="chart-title">近{{days}}日设备统计</h2>
            <el-radio-group v-model="days" @change="fetchLine" size="small">
              <el-radio-button :label="7">近7日</el-radio-button>
              <el-radio-button :label="30">近30日</el-radio-button>
            </el-radio-group>
          </div>
          <v-chart :option="lineOption" autoresize class="chart" />
        </div>
        
        <div class="chart-wrapper">
          <h2 class="chart-title">设备状态分布</h2>
          <v-chart :option="pieOption" autoresize class="chart" />
        </div>
      </div>
      
      <div class="charts-container" style="margin-top: 30px;">
        <div class="chart-wrapper bar-chart-wrapper">
          <h2 class="chart-title">设备预约次数 TOP5</h2>
          <v-chart :option="barOption" autoresize class="chart bar-chart" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDeviceStats, getDeviceStatusStats, getReservationStats } from '../../api/statistics';
import VChart from 'vue-echarts';

const days = ref(7);
const lineOption = ref({});
const pieOption = ref({});
const barOption = ref({});

      async function fetchLine() {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days.value + 1);
        const params = {
          begin: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
        };
        const res = await getDeviceStats(params);
        const data = res.data?.data || {};
        const dateList = (data.dateList || '').split(',');
        const newList = (data.newDeviceList || '').split(',');
        const totalList = (data.totalDeviceList || '').split(',');
        lineOption.value = {
          title: { 
            text: '设备统计', 
            left: 'center', 
            textStyle: { fontSize: 14, fontWeight: 'bold' } 
          },
          tooltip: { 
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#ddd',
            borderWidth: 1,
            textStyle: { color: '#333' }
          },
          legend: { 
            data: ['新增', '总数'], 
            top: 24,
            right: 20
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: { 
            type: 'category', 
            data: dateList,
            boundaryGap: false
          },
          yAxis: { type: 'value' },
          series: [
            { 
              name: '新增', 
              type: 'line', 
              data: newList,
              smooth: true,
              symbolSize: 6,
              itemStyle: { color: '#409eff' },
              areaStyle: { opacity: 0.3 }
            },
            { 
              name: '总数', 
              type: 'line', 
              data: totalList,
              smooth: true,
              symbolSize: 6,
              itemStyle: { color: '#67c23a' }
            },
          ],
        };
      }

      async function fetchPie() {
        const res = await getDeviceStatusStats();
        const d = res.data?.data || {};
        pieOption.value = {
          title: { 
            text: '设备状态分布', 
            left: 'center', 
            textStyle: { fontSize: 14, fontWeight: 'bold' } 
          },
          tooltip: { 
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: { 
            bottom: 10,
            left: 'center'
          },
          series: [
            {
              name: '设备状态',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: { 
                borderRadius: 8, 
                borderColor: '#fff', 
                borderWidth: 2 
              },
              label: { 
                show: true,
                formatter: '{b}: {c}'
              },
              emphasis: { 
                label: { 
                  show: true, 
                  fontSize: 14, 
                  fontWeight: 'bold' 
                } 
              },
              data: [
                { value: d.onUseDeviceCount, name: '正常可用' },
                { value: d.outUseDeviceCount, name: '借出' },
                { value: d.repairDeviceCount, name: '维修中' },
                { value: d.scrapDeviceCount, name: '报废' },
                { value: d.reservedDeviceCount, name: '已预约' },
              ],
            },
          ],
        };
      }

      async function fetchBar() {
        const res = await getReservationStats();
        const list = res.data?.data || [];
        // 按 successCount 降序排列，取前5
        const sorted = list.sort((a, b) => b.successCount - a.successCount).slice(0, 5);
        // 横向柱状图
        const names = sorted.map(item => item.deviceName).reverse();
        const counts = sorted.map(item => item.successCount).reverse();

        barOption.value = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
          },
          grid: {
            left: '3%',
            right: '10%',
            bottom: '3%',
            top: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'value',
            name: '预约次数',
            nameTextStyle: { fontSize: 12, color: '#666' },
            boundaryGap: [0, 0.01]
          },
          yAxis: {
            type: 'category',
            data: names,
            axisLabel: {
              fontSize: 13,
              color: '#333'
            }
          },
          series: [
            {
              name: '预约次数',
              type: 'bar',
              data: counts,
              barWidth: 20,
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: '#409eff' },
                    { offset: 1, color: '#67c23a' }
                  ]
                },
                borderRadius: [0, 4, 4, 0]
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{c} 次',
                fontSize: 12,
                color: '#606266'
              }
            }
          ]
        };
      }

      onMounted(() => {
        fetchLine();
        fetchPie();
        fetchBar();
      });
      </script>

      <style scoped>
.home-page {
  padding: 20px;
  background-color: #f5f6fa;
  min-height: calc(100vh - 60px);
}

.home-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
}

.home-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.home-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.charts-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
}

.chart-wrapper {
  flex: 1;
  min-width: 300px;
  max-width: 600px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chart {
  height: 350px;
  width: 100%;
}

.bar-chart-wrapper {
  max-width: 100%;
  flex: 1;
}

.bar-chart {
  height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-page {
    padding: 15px;
  }
  
  .home-title {
    font-size: 24px;
  }
  
  .charts-container {
    flex-direction: column;
    gap: 25px;
  }
  
  .chart-wrapper {
    min-width: 100%;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
