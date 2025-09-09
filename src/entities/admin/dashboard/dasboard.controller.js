import { generateResponse } from "../../../lib/responseFormate.js";
import { getDashboardData } from "./dashboard.service.js";

export const dashboard = async(req,res)=>{
    try {
        let { startDate, endDate } = req.query;

        // Default to today's range if not provided
        if (!startDate || !endDate) {
            const now = new Date();
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            startDate = start.toISOString();
            endDate = end.toISOString();
        }

        const dashboardData = await getDashboardData(startDate, endDate);
        generateResponse(res, 200, true, "Dashboard data fetched successfully", dashboardData);
    } catch (error) {
        generateResponse(res, 500, false, "Failed to fetch dashboard data", error.message);
    }
}