<template>


  <div class="home-page">
    <el-card>
      <div style="font-size:22px;font-weight:bold;margin-bottom:12px;">欢迎使用设备管理系统</div>
      <div style="display:flex;gap:32px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="margin-bottom:8px;">近{{days}}日设备统计</div>
          <v-chart :option="lineOption" autoresize style="height:300px" />
          <el-radio-group v-model="days" @change="fetchLine">
            <el-radio-button :label="7">近7日</el-radio-button>
            <el-radio-button :label="30">近30日</el-radio-button>
          </el-radio-group>
        </div>
        <div style="width:400px;">
          <div style="margin-bottom:8px;">设备状态分布</div>
          <v-chart :option="pieOption" autoresize style="height:300px" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDeviceStats, getDeviceStatusStats } from '../../api/statistics';
import VChart from 'vue-echarts';

const days = ref(7);
const lineOption = ref({});
const pieOption = ref({});

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
          title: { text: '设备统计', left: 'center', textStyle: { fontSize: 14 } },
          tooltip: { trigger: 'axis' },
          legend: { data: ['新增', '总数'], top: 24 },
          xAxis: { type: 'category', data: dateList },
          yAxis: { type: 'value' },
          series: [
            { name: '新增', type: 'line', data: newList },
            { name: '总数', type: 'line', data: totalList },
          ],
        };
      }

      async function fetchPie() {
        const res = await getDeviceStatusStats();
        const d = res.data?.data || {};
        pieOption.value = {
          title: { text: '设备状态分布', left: 'center', textStyle: { fontSize: 14 } },
          tooltip: { trigger: 'item' },
          legend: { bottom: 0 },
          series: [
            {
              name: '设备状态',
              type: 'pie',
              radius: ['50%', '80%'],
              avoidLabelOverlap: false,
              itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
              label: { show: false, position: 'center' },
              emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
              data: [
                { value: d.totalDeviceCount, name: '总数' },
                { value: d.onUseDeviceCount, name: '正常可用' },
                { value: d.outUserDeviceCount, name: '借出未归还' },
                { value: d.repairDeviceCount, name: '维修中' },
                { value: d.scrapDeviceCount, name: '报废' },
              ],
            },
          ],
        };
      }

      onMounted(() => {
        fetchLine();
        fetchPie();
      });
      </script>

      <style scoped>
      .home-page {
        padding: 24px;
      }
      .home-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 24px;
        text-align: center;
      }
      .home-charts {
        display: flex;
        gap: 40px;
        justify-content: center;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .home-chart-left, .home-chart-right {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px #0000000d;
        padding: 16px;
        min-width: 380px;
        flex: 1 1 380px;
        max-width: 600px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .chart-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        text-align: center;
      }
      .chart-main {
        width: 100%;
        height: 320px;
        margin-bottom: 16px;
      }
      .chart-radio {
        margin-bottom: 0;
      }
      </style>
