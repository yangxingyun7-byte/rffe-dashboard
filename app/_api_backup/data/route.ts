import { NextResponse } from "next/server";

// ============================================================
// RFFE Dashboard 后端 API
// 数据源：飞书电子表格
// ============================================================

// 飞书应用凭证（需要在环境变量中配置）
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || "";
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || "";
const FEISHU_SPREADSHEET_TOKEN = "ICOts6o33hGMwmtJmSEcYY51nVf";
const FEISHU_SHEET_ID = "902rKA"; // RFFE Case control table

// 数据缓存（生产环境建议用 Redis）
let cachedData: any = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

// 获取飞书 Access Token
async function getFeishuToken(): Promise<string> {
  const res = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: FEISHU_APP_ID,
        app_secret: FEISHU_APP_SECRET,
      }),
    }
  );
  const data = await res.json();
  console.log("Feishu token response:", JSON.stringify(data));
  if (!data.tenant_access_token) {
    throw new Error(`获取飞书 Token 失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

// 读取飞书表格数据
async function readFeishuSheet(
  token: string,
  range: string
): Promise<any[][]> {
  const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${FEISHU_SPREADSHEET_TOKEN}/values/${range}`;
  console.log("Fetching sheet data from:", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log("Sheet API response:", JSON.stringify(data).substring(0, 500));
  return data?.data?.valueRange?.values || [];
}

// 提取纯文本（处理飞书所有格式的单元格值）
function extractText(cell: any): string {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "string") return cell.trim();
  if (typeof cell === "number") return String(cell);
  if (typeof cell === "boolean") return cell ? "是" : "否";
  if (Array.isArray(cell)) {
    // 富文本数组：[{text: "已测", type: "text"}, ...]
    return cell
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.link) return item.text || item.link;
        if (item?.mention_type) return item.text || "";
        return "";
      })
      .join("")
      .trim();
  }
  if (typeof cell === "object") {
    if (cell.text) return cell.text.trim();
    if (cell.value) return String(cell.value).trim();
    // 可能是飞书的段落格式
    if (cell.segments) {
      return cell.segments.map((s: any) => s.text || "").join("").trim();
    }
  }
  return String(cell).trim();
}

// 解析测试状态
function parseStatus(text: string): "tested" | "untested" | "na" {
  if (text === "已测") return "tested";
  if (text === "未测") return "untested";
  if (text === "无" || text === "") return "na";
  return "untested";
}

// 主数据转换函数
function transformData(rawValues: any[][]) {
  // 行 4 (index 3) = 表头
  // 行 5 (index 4) = 器件类型
  // 行 6 (index 5) = 器件型号
  // 行 7-20 (index 6-19) = 测试数据

  const deviceModels = [
    "QM77055", "QM77048", "VC7535-88", "QM78218", "QM78318",
    "VC7579", "VC8016", "VC7514", "MXD98M9EA", "MXD9823AT", "VC3726M",
  ];

  const deviceTypes = [
    "LB L-PAMID", "MHB L-PAMID", "CBL L-PAMIF", "CBL L-PAMIF",
    "CBL L-PAMIF", "CBL L-PAMIF", "LMHB PA", "Sub7G UHB PA",
    "D-FEM", "D-FEM", "D-FEM",
  ];

  const testCases = [
    { name: "PA DROOP", path: "TX" },
    { name: "PA AM-AM", path: "TX" },
    { name: "IMD3/5", path: "TX" },
    { name: "PA Harmonic", path: "TX" },
    { name: "TX ACLR", path: "TX" },
    { name: "TX EVM", path: "TX" },
    { name: "Power VS Current", path: "TX" },
    { name: "2G Vramp", path: "TX" },
    { name: "Chip Vramp", path: "TX" },
    { name: "TRX ISOLATION", path: "PRX" },
    { name: "LNA DROOP", path: "PRX,DRX" },
    { name: "LNA Phase Error", path: "PRX,DRX" },
    { name: "LNA IP3", path: "PRX,DRX" },
    { name: "RX Noise Figure", path: "PRX,DRX" },
  ];

  // 构建覆盖矩阵
  const matrix: Record<string, Record<string, string>> = {};
  const caseDetails: Record<string, any> = {};

  testCases.forEach((tc, tcIdx) => {
    const rowIdx = tcIdx + 6; // 数据从第 7 行开始 (index 6)
    const row = rawValues[rowIdx] || [];

    matrix[tc.name] = {};
    const details: any = {
      name: tc.name,
      path: tc.path,
      devices: {},
      difficulty: extractText(row[13]) || null,
      rsSolution: extractText(row[14]) || null,
      keysightSolution: extractText(row[15]) || null,
    };

    deviceModels.forEach((model, devIdx) => {
      const colIdx = devIdx + 2; // 器件数据从 C 列开始 (index 2)
      const status = parseStatus(extractText(row[colIdx]));
      matrix[tc.name][model] = status;
      details.devices[model] = status;
    });

    caseDetails[tc.name] = details;
  });

  // 统计数据
  let tested = 0;
  let untested = 0;
  let na = 0;
  const totalCases = testCases.length;
  const totalDevices = deviceModels.length;

  Object.values(matrix).forEach((row) => {
    Object.values(row).forEach((status) => {
      if (status === "tested") tested++;
      else if (status === "untested") untested++;
      else na++;
    });
  });

  const applicable = tested + untested;
  const coverage = applicable > 0 ? Math.round((tested / applicable) * 100) : 0;

  // 仪表方案分布统计
  let rsCount = 0;
  let keysightCount = 0;
  Object.values(caseDetails).forEach((tc: any) => {
    if (tc.rsSolution) rsCount++;
    if (tc.keysightSolution) keysightCount++;
  });

  return {
    // 基础信息
    lastUpdated: new Date().toISOString(),
    spreadsheetUrl: `https://mi.feishu.cn/sheets/${FEISHU_SPREADSHEET_TOKEN}?sheet=${FEISHU_SHEET_ID}`,

    // 器件信息
    devices: deviceModels.map((model, idx) => ({
      name: model,
      type: deviceTypes[idx],
    })),

    // 测试用例
    testCases: testCases.map((tc) => ({
      name: tc.name,
      path: tc.path,
    })),

    // 覆盖矩阵
    matrix,

    // 每个 Case 的详情
    caseDetails,

    // 统计数据
    stats: {
      totalDevices,
      totalCases,
      tested,
      untested,
      na,
      coverage,
      rsSolutionCount: rsCount,
      keysightSolutionCount: keysightCount,
    },
  };
}

// API 路由处理
export async function GET(request: Request) {
  try {
    // 检查是否有 debug 参数
    const { searchParams } = new URL(request.url);
    const isDebug = searchParams.get("debug") === "true";

    // 检查缓存
    if (!isDebug && cachedData && Date.now() - cacheTime < CACHE_TTL) {
      return NextResponse.json(cachedData);
    }

    // 如果没有配置飞书凭证，返回模拟数据
    if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
      return NextResponse.json(
        {
          error: "飞书 API 凭证未配置",
          hint: "请在 .env.local 中设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET",
          // 返回空结构，前端可以降级处理
          stats: {
            totalDevices: 13,
            totalCases: 14,
            tested: 0,
            untested: 0,
            na: 0,
            coverage: 0,
          },
          devices: [],
          testCases: [],
          matrix: {},
          caseDetails: {},
        },
        { status: 200 }
      );
    }

    // 获取飞书 Token
    const token = await getFeishuToken();

    // 读取表格数据
    const rawValues = await readFeishuSheet(token, `${FEISHU_SHEET_ID}!A1:Y23`);

    // Debug 模式：返回原始数据
    if (isDebug) {
      return NextResponse.json({
        rawValues: rawValues.slice(6, 8), // 只返回前两行测试数据
        row6Sample: rawValues[6]?.slice(0, 5),
        row7Sample: rawValues[7]?.slice(0, 5),
      });
    }

    // 转换数据
    const result = transformData(rawValues);

    // 更新缓存
    cachedData = result;
    cacheTime = Date.now();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "数据获取失败", message: error.message },
      { status: 500 }
    );
  }
}
