import request from './request';

// 提交预约申请
export const applyReservation = (data) => request.post('/reservation/apply', data);

// 查询我的预约单（分页）
export const getMyReservations = (params) => request.get('/reservation/user/page', { params });

// 查询预约单关联的设备
export const getReservationDevices = (reservationId) => request.get(`/reservation/devices/${reservationId}`);

// 取消预约（仅限待审核状态）
export const cancelReservation = (id) => request.put(`/reservation/cancel/${id}`);

// 归还设备（完成预约）
export const completeReservation = (id) => request.put(`/reservation/complete/${id}`);

// 管理员分页查询所有预约单
export const getAdminReservationPage = (params) => request.get('/admin/orders/reservation/page', { params });

// 管理员审批预约单
export const handleReservation = (id, status) => request.put(`/admin/orders/reservation/handle/${id}?status=${status}`);

export default {
  applyReservation,
  getMyReservations,
  getReservationDevices,
  cancelReservation,
  completeReservation,
  getAdminReservationPage,
  handleReservation
};
