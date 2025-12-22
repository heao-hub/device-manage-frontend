<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
        <el-button type="primary" @click="fetchOrders">查询</el-button>
      </div>
      <el-table :data="orders" border stripe style="width:100%">

        <el-table-column prop="code" label="入库单编号" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="count" label="数量" />
        <el-table-column prop="price" label="价格" />
        <el-table-column prop="manufacturer" label="厂商" />
        <el-table-column prop="deptName" label="所属单位" />
        <el-table-column prop="createTime" label="入库时间" />
        <el-table-column prop="adminName" label="处理人" />
      </el-table>
      <el-pagination
        v-model:current-page="page.page"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchOrders"
        @size-change="fetchOrders"
        style="margin-top:16px;text-align:right;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getInsertOrderPage } from '../../api/order';

const orders = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ timeRange: [] });

const fetchOrders = async () => {
  const params = {
    page: page.page,
    pageSize: page.pageSize,
    beginTime: searchForm.timeRange?.[0] || '',
    endTime: searchForm.timeRange?.[1] || '',
  };
  const res = await getInsertOrderPage(params);
  if (res.data && res.data.code === 1) {
    orders.value = res.data.data.records;
    page.total = res.data.data.total;
  }
};
onMounted(fetchOrders);
</script>
