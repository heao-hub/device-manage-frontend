<template>
  <div class="statistics-dashboard">
    <el-card class="header-card">
      <div class="dashboard-header">
        <h2 class="page-title">数据统计</h2>
        <div class="time-filter">
          <el-radio-group v-model="days" @change="fetchAll" size="medium">
            <el-radio-button :value="7">近7日</el-radio-button>
            <el-radio-button :value="30">近30日</el-radio-button>
          </el-radio-group>
          <el-button 
            type="primary" 
            @click="fetchAll" 
            icon="Refresh"
            style="margin-left: 15px;"
          >刷新</el-button>
        </div>
      </div>
    </el-card>
    
    <el-card class="summary-card" style="margin: 20px 0;">
      <div class="summary-header">
        <h3 class="summary-title">统计摘要</h3>
      </div>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">预约单总数</div>
            <div class="summary-value">{{ summaryData.borrowTotal || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">反馈单总数</div>
            <div class="summary-value">{{ summaryData.feedbackTotal || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">入库单总数</div>
            <div class="summary-value">{{ summaryData.insertTotal || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-item">
            <div class="summary-label">报废单总数</div>
            <div class="summary-value">{{ summaryData.scrapTotal || 0 }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
    
    <div class="charts-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <div class="chart-header">
              <h3 class="chart-title">预约单统计</h3>
            </div>
            <v-chart 
              :option="borrowOption" 
              autoresize 
              style="height: 350px;"
              ref="borrowChart"
            />
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <div class="chart-header">
              <h3 class="chart-title">反馈单统计</h3>
            </div>
            <v-chart 
              :option="feedbackOption" 
              autoresize 
              style="height: 350px;"
              ref="feedbackChart"
            />
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <div class="chart-header">
              <h3 class="chart-title">入库单统计</h3>
            </div>
            <v-chart 
              :option="insertOption" 
              autoresize 
              style="height: 350px;"
              ref="insertChart"
            />
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <div class="chart-header">
              <h3 class="chart-title">报废单统计</h3>
            </div>
            <v-chart 
              :option="scrapOption" 
              autoresize 
              style="height: 350px;"
              ref="scrapChart"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBorrowOrderStats, getFeedbackOrderStats, getInsertOrderStats, getScrapOrderStats } from '../../api/order';
import VChart from 'vue-echarts';

// 引入图标
import { Refresh } from '@element-plus/icons-vue';

const days = ref(7);
const borrowOption = ref({});
const feedbackOption = ref({});
const insertOption = ref({});
const scrapOption = ref({});

// 图表引用
const borrowChart = ref(null);
const feedbackChart = ref(null);
const insertChart = ref(null);
const scrapChart = ref(null);

// 统计摘要数据
const summaryData = reactive({
  borrowTotal: 0,
  feedbackTotal: 0,
  insertTotal: 0,
  scrapTotal: 0
});

function getRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days.value + 1);
  return {
    beginTime: start.toISOString().slice(0, 10),
    endTime: end.toISOString().slice(0, 10),
  };
}

async function fetchAll() {
  try {
    const range = getRange();
    const [borrow, feedback, insert, scrap] = await Promise.all([
      getBorrowOrderStats(range),
      getFeedbackOrderStats(range),
      getInsertOrderStats(range),
      getScrapOrderStats(range),
    ]);
    
    // 更新图表数据
    borrowOption.value = makeLineOption('预约单', borrow.data?.data);
    feedbackOption.value = makeLineOption('反馈单', feedback.data?.data);
    insertOption.value = makeLineOption('入库单', insert.data?.data);
    scrapOption.value = makeLineOption('报废单', scrap.data?.data);
    
    // 更新摘要数据
    updateSummaryData(borrow.data?.data, feedback.data?.data, insert.data?.data, scrap.data?.data);
  } catch (error) {
    ElMessage.error('获取统计数据失败');
  }
}

function updateSummaryData(borrowData, feedbackData, insertData, scrapData) {
  // 获取最新的总数数据
  if (borrowData?.totalBorrowOrderList) {
    const borrowTotals = borrowData.totalBorrowOrderList.split(',');
    summaryData.borrowTotal = borrowTotals.length > 0 ? parseInt(borrowTotals[borrowTotals.length - 1]) || 0 : 0;
  }
  
  if (feedbackData?.totalFeedbackOrderList) {
    const feedbackTotals = feedbackData.totalFeedbackOrderList.split(',');
    summaryData.feedbackTotal = feedbackTotals.length > 0 ? parseInt(feedbackTotals[feedbackTotals.length - 1]) || 0 : 0;
  }
  
  if (insertData?.totalInsertOrderList) {
    const insertTotals = insertData.totalInsertOrderList.split(',');
    summaryData.insertTotal = insertTotals.length > 0 ? parseInt(insertTotals[insertTotals.length - 1]) || 0 : 0;
  }
  
  if (scrapData?.totalScrapOrderList) {
    const scrapTotals = scrapData.totalScrapOrderList.split(',');
    summaryData.scrapTotal = scrapTotals.length > 0 ? parseInt(scrapTotals[scrapTotals.length - 1]) || 0 : 0;
  }
}

function makeLineOption(title, data) {
  if (!data) return {};
  
  const dateList = (data.dateList || '').split(',');
  const newList = (data.newReservationOrderList || data.newFeedbackOrderList || data.newInsertOrderList || data.newScrapOrderList || '').split(',').map(Number);
  const totalList = (data.totalReservationOrderList || data.totalFeedbackOrderList || data.totalInsertOrderList || data.totalScrapOrderList || '').split(',').map(Number);
  
  return {
    title: { 
      text: title, 
      left: 'center', 
      textStyle: { 
        fontSize: 16,
        fontWeight: 'bold'
      } 
    },
    tooltip: { 
      trigger: 'axis',
      formatter: function (params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          result += param.marker + param.seriesName + ': ' + param.value + '<br/>';
        });
        return result;
      }
    },
    legend: { 
      data: ['新增', '总数'], 
      top: 30,
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
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: { 
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      { 
        name: '新增', 
        type: 'line', 
        data: newList,
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          opacity: 0.1
        }
      },
      { 
        name: '总数', 
        type: 'line', 
        data: totalList,
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          opacity: 0.1
        }
      },
    ],
  };
}



onMounted(fetchAll);
</script>

<style scoped>
.statistics-dashboard {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.time-filter {
  display: flex;
  align-items: center;
}

.charts-container {
  margin-top: 20px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.chart-actions {
  /* 图表操作按钮 */
}

.summary-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.summary-header {
  margin-bottom: 20px;
}

.summary-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.summary-item {
  text-align: center;
  padding: 20px 0;
  border-radius: 4px;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.summary-item:hover {
  background-color: #ebeef5;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .statistics-dashboard {
    padding: 15px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .time-filter {
    width: 100%;
    justify-content: space-between;
  }
  
  .el-col {
    width: 100%;
    margin-bottom: 15px;
  }
  
  .charts-container .el-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .summary-item {
    padding: 15px 0;
  }
  
  .summary-value {
    font-size: 20px;
  }
}
</style>
