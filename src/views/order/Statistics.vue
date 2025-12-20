<template>
  <div>
    <el-card>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;">
        <el-radio-group v-model="days" @change="fetchAll">
          <el-radio-button :value="7">近7日</el-radio-button>
          <el-radio-button :value="30">近30日</el-radio-button>
        </el-radio-group>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <div>
          <div style="margin-bottom:8px;">借条统计</div>
          <v-chart :option="borrowOption" autoresize style="height:300px" />
        </div>
        <div>
          <div style="margin-bottom:8px;">反馈单统计</div>
          <v-chart :option="feedbackOption" autoresize style="height:300px" />
        </div>
        <div>
          <div style="margin-bottom:8px;">入库单统计</div>
          <v-chart :option="insertOption" autoresize style="height:300px" />
        </div>
        <div>
          <div style="margin-bottom:8px;">报废单统计</div>
          <v-chart :option="scrapOption" autoresize style="height:300px" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getBorrowOrderStats, getFeedbackOrderStats, getInsertOrderStats, getScrapOrderStats } from '../../api/order';
import VChart from 'vue-echarts';

const days = ref(7);
const borrowOption = ref({});
const feedbackOption = ref({});
const insertOption = ref({});
const scrapOption = ref({});

function getRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days.value + 1);
  return {
    begin: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

async function fetchAll() {
  const range = getRange();
  const [borrow, feedback, insert, scrap] = await Promise.all([
    getBorrowOrderStats(range),
    getFeedbackOrderStats(range),
    getInsertOrderStats(range),
    getScrapOrderStats(range),
  ]);
  borrowOption.value = makeLineOption('借条', borrow.data?.data);
  feedbackOption.value = makeLineOption('反馈单', feedback.data?.data);
  insertOption.value = makeLineOption('入库单', insert.data?.data);
  scrapOption.value = makeLineOption('报废单', scrap.data?.data);
}

function makeLineOption(title, data) {
  if (!data) return {};
  const dateList = (data.dateList || '').split(',');
  const newList = (data.newBorrowOrderList || data.newFeedbackOrderList || data.newInsertOrderList || data.newScrapOrderList || '').split(',');
  const totalList = (data.totalBorrowOrderList || data.totalFeedbackOrderList || data.totalInsertOrderList || data.totalScrapOrderList || '').split(',');
  return {
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
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

onMounted(fetchAll);
</script>
