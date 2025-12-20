import request from './request';

// 查询用户反馈信息
export const getUserFeedbacks = (params) => request.get('/feedbacks/page', { params });
// 提交设备问题反馈
export const submitFeedback = (data) => request.post('/feedbacks', data);

export default {
	getUserFeedbacks,
	submitFeedback
};
