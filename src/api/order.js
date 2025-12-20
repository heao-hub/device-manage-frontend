import request from './request';

// 借条管理
export const getBorrowOrderPage = (params) => request.get('/admin/orders/borrow/page', { params });
export const handleBorrowOrder = (data) => request.put('/admin/orders/borrow/handle', data);
// 反馈表管理
export const getFeedbackOrderPage = (params) => request.get('/admin/orders/feedback/page', { params });
export const handleFeedbackOrder = (data) => request.put('/admin/orders/feedback/handle', data);
// 入库单管理
export const getInsertOrderPage = (params) => request.get('/admin/orders/insert/page', { params });
// 报废单管理
export const getScrapOrderPage = (params) => request.get('/admin/orders/scrap/page', { params });
// 统计
export const getInsertOrderStats = (params) => request.get('/admin/orders/statistics/insert', { params });
export const getBorrowOrderStats = (params) => request.get('/admin/orders/statistics/borrow', { params });
export const getFeedbackOrderStats = (params) => request.get('/admin/orders/statistics/feedback', { params });
export const getScrapOrderStats = (params) => request.get('/admin/orders/statistics/scrap', { params });

export default {
	getBorrowOrderPage,
	handleBorrowOrder,
	getFeedbackOrderPage,
	handleFeedbackOrder,
	getInsertOrderPage,
	getScrapOrderPage,
	getInsertOrderStats,
	getBorrowOrderStats,
	getFeedbackOrderStats,
	getScrapOrderStats
};
