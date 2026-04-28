# 核心网黄金指标分析系统 — API 接口文档

> **版本**：v1.1  
> **日期**：2026-04-22  
> **配套文档**：golden_metrics_PRD.md v1.1、golden_metrics_prototype.md v2.1  
> **Base URL**：`/api/v1`

---

## 通用约定

### 认证方式

所有接口（登录除外）需在请求头携带 JWT Token：

```
Authorization: Bearer <jwt_token>
```

### 数据权限

- 后端根据用户角色自动注入省份过滤条件
- 集团用户（`GROUP_ADMIN`）：不注入过滤，可查全国
- 省级用户（`PROVINCE_ADMIN`/`PROVINCE_OPERATOR`）：自动注入 `province_code = 用户所属省份`
- 只读用户（`VIEWER`）：按授权省份过滤

### 请求/响应格式

- Content-Type: `application/json`
- 响应统一结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1713264000000
}
```

### 错误码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如名称重复） |
| 429 | 请求过于频繁 |
| 500 | 服务内部错误 |

### 业务错误码（code 字段）

| code | 说明 |
|------|------|
| 10001 | 规则名称重复 (RULE_NAME_DUPLICATE) |
| 10002 | 规则条件无效 (RULE_CONDITION_INVALID) |
| 10003 | 指标数据不可用 (METRIC_DATA_UNAVAILABLE) |
| 10004 | 导出任务数超限 (EXPORT_TASK_LIMIT) |
| 10005 | 告警已处理 (ALARM_ALREADY_HANDLED) |
| 10006 | 无操作权限 (NO_PERMISSION) |
| 10007 | 规则不存在 (RULE_NOT_FOUND) |
| 10008 | 告警事件不存在 (EVENT_NOT_FOUND) |
| 10009 | 模板不存在 (TEMPLATE_NOT_FOUND) |
| 10010 | 导出任务不存在 (EXPORT_TASK_NOT_FOUND) |
| 10011 | 聚合规则名称重复 (AGG_RULE_NAME_DUPLICATE) |
| 10012 | 聚合规则不存在 (AGG_RULE_NOT_FOUND) |
| 10013 | 衍生告警不存在 (DERIVED_ALARM_NOT_FOUND) |
| 10014 | 衍生告警不支持人工操作 (DERIVED_ALARM_NO_ACTION) |

### 分页约定

请求参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码（从1开始） |
| page_size | int | 20 | 每页条数（最大100） |

响应结构：

```json
{
  "total": 150,
  "page": 1,
  "page_size": 20,
  "list": []
}
```

### 排序约定

| 参数 | 类型 | 说明 |
|------|------|------|
| sort_by | string | 排序字段 |
| sort_order | string | `asc` / `desc`，默认 `desc` |

---

## 一、认证模块

### 1.1 用户登录

**POST** `/auth/login`

| 权限 | 无需认证 |
|------|----------|

**请求体**：

```json
{
  "username": "zhangsan",
  "password": "******"
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 7200,
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "user_id": "u001",
      "username": "zhangsan",
      "display_name": "张三",
      "role": "PROVINCE_ADMIN",
      "province_code": "GD",
      "province_name": "广东",
      "permissions": ["rule:create", "rule:edit", "rule:delete", "alarm:confirm", "alarm:export", "report:export"]
    }
  }
}
```

### 1.2 刷新Token

**POST** `/auth/refresh`

| 权限 | 无需认证（需 refresh_token） |
|------|------|

**请求体**：

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 7200
  }
}
```

### 1.3 获取当前用户信息

**GET** `/auth/me`

| 权限 | 已认证用户 |
|------|------|

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user_id": "u001",
    "username": "zhangsan",
    "display_name": "张三",
    "role": "PROVINCE_ADMIN",
    "province_code": "GD",
    "province_name": "广东",
    "permissions": ["rule:create", "rule:edit", "rule:delete", "alarm:confirm", "alarm:export", "report:export"]
  }
}
```

---

## 二、规则配置模块

### 2.1 查询规则列表

**GET** `/rules`

| 权限 | rule:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ne_type | string | 否 | 网元类型筛选 |
| status | int | 否 | 规则状态：0停用/1启用 |
| rule_name | string | 否 | 规则名称模糊搜索 |
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页条数，默认20 |
| sort_by | string | 否 | 排序字段，默认 created_at |
| sort_order | string | 否 | asc/desc，默认 desc |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 56,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "rule_id": 1001,
        "rule_name": "AMF注册成功率异常监控",
        "ne_type": "AMF",
        "severity": 2,
        "conditions": [
          {
            "metric_code": "registration_rate",
            "metric_name": "注册成功率",
            "metric_unit": "percent",
            "threshold_type": "qoq",
            "operator": "lt",
            "threshold_value": -20.0,
            "offset_percent": -20.0
          }
        ],
        "logic_operator": "AND",
        "observe_window": 3,
        "recovery_window": 3,
        "effective_type": "custom",
        "effective_periods": {
          "start_time": "08:00",
          "end_time": "20:00"
        },
        "effective_weekdays": "1,2,3,4,5",
        "exception_dates": [
          { "date": "2026-05-01", "name": "劳动节", "repeat_yearly": true }
        ],
        "status": 1,
        "sop_template": "1. 检查AMF进程状态\n2. 查看注册接口日志",
        "created_by": "zhangsan",
        "created_at": "2026-04-10 14:30:00",
        "updated_at": "2026-04-16 09:15:00"
      }
    ]
  }
}
```

### 2.2 获取规则详情

**GET** `/rules/{rule_id}`

| 权限 | rule:list |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| rule_id | bigint | 规则ID |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 1001,
    "rule_name": "AMF注册成功率异常监控",
    "ne_type": "AMF",
    "template_id": null,
    "description": "监控AMF注册成功率的环比异常下降",
    "severity": 2,
    "conditions": [
      {
        "metric_code": "registration_rate",
        "metric_name": "注册成功率",
        "metric_unit": "percent",
        "threshold_type": "qoq",
        "operator": "lt",
        "threshold_value": -20.0,
        "offset_percent": -20.0
      }
    ],
    "logic_operator": "AND",
    "observe_window": 3,
    "recovery_window": 3,
    "effective_type": "custom",
    "effective_periods": {
      "start_time": "08:00",
      "end_time": "20:00"
    },
    "effective_weekdays": "1,2,3,4,5",
    "exception_dates": [
      { "date": "2026-05-01", "name": "劳动节", "repeat_yearly": true }
    ],
    "status": 1,
    "sop_template": "1. 检查AMF进程状态\n2. 查看注册接口日志\n3. 检查HSS/UDM连接状态",
    "province_code": "GD",
    "created_by": "zhangsan",
    "created_at": "2026-04-10 14:30:00",
    "updated_at": "2026-04-16 09:15:00"
  }
}
```

### 2.3 创建规则

**POST** `/rules`

| 权限 | rule:create |
|------|------|

**请求体**：

```json
{
  "rule_name": "AMF注册成功率异常监控",
  "ne_type": "AMF",
  "template_id": null,
  "description": "监控AMF注册成功率的环比异常下降",
  "severity": 2,
  "conditions": [
    {
      "metric_code": "registration_rate",
      "metric_name": "注册成功率",
      "metric_unit": "percent",
      "threshold_type": "qoq",
      "operator": "lt",
      "threshold_value": -20.0,
      "offset_percent": -20.0
    },
    {
      "metric_code": "session_setup_rate",
      "metric_name": "会话建立率",
      "metric_unit": "percent",
      "threshold_type": "absolute",
      "operator": "lt",
      "threshold_value": 95.0
    }
  ],
  "logic_operator": "AND",
  "observe_window": 3,
  "recovery_window": 3,
  "effective_type": "custom",
  "effective_periods": {
    "start_time": "08:00",
    "end_time": "20:00"
  },
  "effective_weekdays": "1,2,3,4,5",
  "exception_dates": [
    { "date": "2026-05-01", "name": "劳动节", "repeat_yearly": true }
  ],
  "status": 1,
  "sop_template": "1. 检查AMF进程状态\n2. 查看注册接口日志"
}
```

**字段校验规则**：

| 字段 | 必填 | 校验规则 |
|------|------|----------|
| rule_name | 是 | 2-50字，同类网元内唯一 |
| ne_type | 是 | 20种网元类型枚举值 |
| severity | 是 | 1-4整数 |
| conditions | 是 | 数组，1-5个元素 |
| conditions[].metric_code | 是 | 指标编码，同规则内不可重复 |
| conditions[].threshold_type | 是 | absolute/yoy/qoq |
| conditions[].operator | 是 | lt/lte/gt/gte/eq/ne |
| conditions[].threshold_value | 是 | 数值型0~999999，百分比0~100 |
| logic_operator | 是 | AND/OR |
| observe_window | 是 | 1-30整数 |
| recovery_window | 是 | 1-30整数 |
| effective_type | 是 | always/custom |
| effective_periods | 否 | effective_type=custom时必填 |
| effective_weekdays | 否 | effective_type=custom时必填，1-7逗号分隔 |
| sop_template | 否 | 最多500字 |
| status | 否 | 0/1，默认1 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 1001,
    "rule_name": "AMF注册成功率异常监控"
  }
}
```

**错误响应**：

```json
{
  "code": 10001,
  "message": "规则名称已存在，请修改",
  "data": null
}
```

### 2.4 更新规则

**PUT** `/rules/{rule_id}`

| 权限 | rule:edit |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| rule_id | bigint | 规则ID |

**请求体**：同创建规则，所有字段均可修改

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 1001,
    "affected_events": 3,
    "message": "此修改将影响3条正在生效的告警事件"
  }
}
```

### 2.5 删除规则

**DELETE** `/rules/{rule_id}`

| 权限 | rule:delete |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| rule_id | bigint | 规则ID |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**约束**：规则下有未关闭告警事件时不可删除，返回：

```json
{
  "code": 400,
  "message": "该规则下有3条未关闭告警事件，无法删除",
  "data": { "active_events": 3 }
}
```

### 2.6 批量启用/停用规则

**PUT** `/rules/batch-status`

| 权限 | rule:edit |
|------|------|

**请求体**：

```json
{
  "rule_ids": [1001, 1002, 1003],
  "status": 1
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| rule_ids | 是 | 规则ID数组，最多50个 |
| status | 是 | 0停用/1启用 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 3,
    "fail_count": 0
  }
}
```

### 2.7 批量删除规则

**DELETE** `/rules/batch`

| 权限 | rule:delete |
|------|------|

**请求体**：

```json
{
  "rule_ids": [1001, 1002, 1003]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| rule_ids | 是 | 规则ID数组，最多50个 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 2,
    "fail_count": 1,
    "fail_rules": [
      { "rule_id": 1003, "reason": "该规则下有未关闭告警事件" }
    ]
  }
}
```

### 2.8 检查规则名称唯一性

**GET** `/rules/check-name`

| 权限 | rule:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rule_name | string | 是 | 规则名称 |
| ne_type | string | 是 | 网元类型 |
| exclude_rule_id | bigint | 否 | 编辑时排除当前规则ID |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "available": true
  }
}
```

---

## 三、规则模板模块

### 3.1 查询模板列表

**GET** `/templates`

| 权限 | rule:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ne_type | string | 否 | 网元类型筛选 |
| template_name | string | 否 | 模板名称模糊搜索 |
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页条数，默认20 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 25,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "template_id": 1,
        "template_name": "AMF注册成功率异常监控",
        "ne_type": "AMF",
        "metric_code": "registration_rate",
        "metric_name": "注册成功率",
        "threshold_type": "qoq",
        "threshold_value": -20.0,
        "operator": "lt",
        "observe_window": 3,
        "recovery_window": 3,
        "severity": 2,
        "usage_count": 156,
        "description": "AMF注册成功率环比下降超过20%时触发告警"
      }
    ]
  }
}
```

### 3.2 获取模板详情

**GET** `/templates/{template_id}`

| 权限 | rule:list |
|------|------|

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "template_id": 1,
    "template_name": "AMF注册成功率异常监控",
    "ne_type": "AMF",
    "description": "AMF注册成功率环比下降超过20%时触发告警",
    "severity": 2,
    "conditions": [
      {
        "metric_code": "registration_rate",
        "metric_name": "注册成功率",
        "metric_unit": "percent",
        "threshold_type": "qoq",
        "operator": "lt",
        "threshold_value": -20.0,
        "offset_percent": -20.0
      }
    ],
    "logic_operator": "AND",
    "observe_window": 3,
    "recovery_window": 3,
    "effective_type": "always",
    "sop_template": "1. 检查AMF进程状态\n2. 查看注册接口日志",
    "usage_count": 156
  }
}
```

### 3.3 从模板创建规则

**POST** `/templates/{template_id}/create-rule`

| 权限 | rule:create |
|------|------|

**请求体**（可覆盖模板默认值）：

```json
{
  "rule_name": "AMF注册成功率异常监控-广东",
  "severity": 2,
  "observe_window": 5,
  "recovery_window": 3,
  "threshold_value": -15.0,
  "effective_type": "custom",
  "effective_periods": {
    "start_time": "08:00",
    "end_time": "20:00"
  },
  "effective_weekdays": "1,2,3,4,5",
  "status": 1
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 1010,
    "rule_name": "AMF注册成功率异常监控-广东"
  }
}
```

---

## 三-B、聚合规则模块

### 3B.1 查询聚合规则列表

**GET** `/agg-rules`

| 权限 | rule:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ne_type | string | 否 | 网元类型筛选 |
| status | int | 否 | 规则状态：0停用/1启用 |
| rule_name | string | 否 | 规则名称模糊搜索 |
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页条数，默认20 |
| sort_by | string | 否 | 排序字段，默认 created_at |
| sort_order | string | 否 | asc/desc，默认 desc |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 12,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "rule_id": 5001,
        "rule_name": "AMF注册态用户数聚合",
        "agg_type": "pool",
        "ne_type": "AMF",
        "metric_code": "registered_users",
        "metric_name": "注册态用户数",
        "agg_function": "sum",
        "baseline_type": "yesterday_same_period",
        "operator": "lt",
        "threshold_value": -10.0,
        "observe_window": 3,
        "severity": 2,
        "status": 1,
        "province_code": null,
        "created_by": "zhangsan",
        "created_at": "2026-04-18 09:00:00",
        "updated_at": "2026-04-20 14:30:00"
      }
    ]
  }
}
```

### 3B.2 获取聚合规则详情

**GET** `/agg-rules/{rule_id}`

| 权限 | rule:list |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| rule_id | bigint | 聚合规则ID |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 5001,
    "rule_name": "AMF注册态用户数聚合",
    "agg_type": "pool",
    "ne_type": "AMF",
    "metric_code": "registered_users",
    "metric_name": "注册态用户数",
    "agg_function": "sum",
    "baseline_type": "yesterday_same_period",
    "operator": "lt",
    "threshold_value": -10.0,
    "observe_window": 3,
    "severity": 2,
    "status": 1,
    "province_code": null,
    "created_by": "zhangsan",
    "created_at": "2026-04-18 09:00:00",
    "updated_at": "2026-04-20 14:30:00"
  }
}
```

### 3B.3 创建聚合规则

**POST** `/agg-rules`

| 权限 | rule:create |
|------|------|

**请求体**：

```json
{
  "rule_name": "AMF注册态用户数聚合",
  "ne_type": "AMF",
  "metric_code": "registered_users",
  "metric_name": "注册态用户数",
  "agg_function": "sum",
  "baseline_type": "yesterday_same_period",
  "operator": "lt",
  "threshold_value": -10.0,
  "observe_window": 3,
  "severity": 2,
  "status": 1
}
```

**字段校验规则**：

| 字段 | 必填 | 校验规则 |
|------|------|----------|
| rule_name | 是 | 2-50字，同类网元内唯一 |
| ne_type | 是 | 20种网元类型枚举值 |
| metric_code | 是 | 有效指标编码 |
| metric_name | 是 | 指标名称 |
| agg_function | 是 | sum/avg/max/min |
| baseline_type | 是 | yesterday_same_period/previous_normal_cycle/absolute |
| operator | 是 | lt/lte/gt/gte/eq/ne |
| threshold_value | 是 | 数值型0~999999，百分比0~100 |
| observe_window | 是 | 1-30整数 |
| severity | 是 | 1-4整数 |
| status | 否 | 0/1，默认1 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 5001,
    "rule_name": "AMF注册态用户数聚合"
  }
}
```

**错误响应**：

```json
{
  "code": 10011,
  "message": "聚合规则名称已存在，请修改",
  "data": null
}
```

### 3B.4 更新聚合规则

**PUT** `/agg-rules/{rule_id}`

| 权限 | rule:edit |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| rule_id | bigint | 聚合规则ID |

**请求体**：同创建聚合规则，所有字段均可修改

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rule_id": 5001,
    "affected_derived_alarms": 2,
    "message": "此修改将影响2条正在生效的衍生告警"
  }
}
```

### 3B.5 删除聚合规则

**DELETE** `/agg-rules/{rule_id}`

| 权限 | rule:delete |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| rule_id | bigint | 聚合规则ID |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**约束**：规则下有活跃衍生告警时不可删除，返回：

```json
{
  "code": 400,
  "message": "该规则下有2条活跃衍生告警，无法删除",
  "data": { "active_derived_alarms": 2 }
}
```

### 3B.6 批量启用/停用聚合规则

**PUT** `/agg-rules/batch-status`

| 权限 | rule:edit |
|------|------|

**请求体**：

```json
{
  "rule_ids": [5001, 5002, 5003],
  "status": 1
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| rule_ids | 是 | 规则ID数组，最多50个 |
| status | 是 | 0停用/1启用 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 3,
    "fail_count": 0
  }
}
```

### 3B.7 检查聚合规则名称唯一性

**GET** `/agg-rules/check-name`

| 权限 | rule:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rule_name | string | 是 | 规则名称 |
| ne_type | string | 是 | 网元类型 |
| exclude_rule_id | bigint | 否 | 编辑时排除当前规则ID |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "available": true
  }
}
```

---

## 三-C、衍生告警模块

### 3C.1 查询衍生告警列表

**GET** `/derived-alarms`

| 权限 | alarm:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agg_type | string | 否 | 聚合类型：region/pool |
| region_code | string | 否 | 大区编码（集团用户可用） |
| pool_name | string | 否 | Pool名称 |
| ne_type | string | 否 | 网元类型 |
| severity | string | 否 | 告警等级：1/2/3/4，逗号分隔多选 |
| status | string | 否 | 衍生告警状态：active/clearing/cleared，逗号分隔 |
| start_time | datetime | 否 | 更新时间起始 |
| end_time | datetime | 否 | 更新时间结束 |
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页条数，默认20 |
| sort_by | string | 否 | 排序字段，默认 updated_at |
| sort_order | string | 否 | asc/desc，默认 desc |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 6,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "derived_id": 30001,
        "agg_rule_id": 5001,
        "agg_type": "region",
        "group_key": "HN",
        "group_name": "华南大区",
        "ne_type": "AMF",
        "metric_code": "registration_rate",
        "event_title": "华南大区AMF注册成功率异常",
        "severity": 1,
        "status": "active",
        "child_count": 3,
        "active_child_count": 2,
        "started_at": "2026-04-16 10:25:00",
        "updated_at": "2026-04-16 10:28:00",
        "cleared_at": null
      },
      {
        "derived_id": 30002,
        "agg_rule_id": 5001,
        "agg_type": "pool",
        "group_key": "Pool-GD-AMF-01",
        "group_name": "Pool-GD-AMF-01",
        "ne_type": "AMF",
        "metric_code": "registered_users",
        "event_title": "Pool-GD-AMF-01 AMF注册态用户数下降",
        "severity": 1,
        "status": "active",
        "child_count": 2,
        "active_child_count": 2,
        "agg_value": 128450.0,
        "baseline_value": 145200.0,
        "started_at": "2026-04-16 10:23:00",
        "updated_at": "2026-04-16 10:26:00",
        "cleared_at": null
      }
    ]
  }
}
```

### 3C.2 获取衍生告警详情

**GET** `/derived-alarms/{derived_id}`

| 权限 | alarm:list |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| derived_id | bigint | 衍生告警ID |

**响应体（大区级）**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "derived_id": 30001,
    "agg_rule_id": 0,
    "agg_type": "region",
    "group_key": "HN",
    "group_name": "华南大区",
    "ne_type": "AMF",
    "metric_code": "registration_rate",
    "metric_name": "注册成功率",
    "event_title": "华南大区AMF注册成功率异常",
    "event_detail": "华南大区2个省份（广东、广西）出现AMF注册成功率异常",
    "severity": 1,
    "status": "active",
    "child_count": 3,
    "active_child_count": 2,
    "started_at": "2026-04-16 10:25:00",
    "updated_at": "2026-04-16 10:28:00",
    "cleared_at": null,
    "trigger_config": {
      "min_provinces": 2,
      "time_window_minutes": 30
    },
    "involved_provinces": [
      { "province_code": "GD", "province_name": "广东", "child_count": 2 },
      { "province_code": "GX", "province_name": "广西", "child_count": 1 }
    ],
    "children": [
      {
        "id": 1,
        "event_id": 20001,
        "province_code": "GD",
        "province_name": "广东",
        "ne_id": "NE-AMF-GD-002",
        "ne_name": "AMF-GD-02",
        "severity": 2,
        "child_status": "active",
        "event_title": "注册率下降",
        "joined_at": "2026-04-16 10:25:00",
        "cleared_at": null
      },
      {
        "id": 2,
        "event_id": 20010,
        "province_code": "GX",
        "province_name": "广西",
        "ne_id": "NE-AMF-GX-001",
        "ne_name": "AMF-GX-01",
        "severity": 3,
        "child_status": "active",
        "event_title": "注册率波动",
        "joined_at": "2026-04-16 10:28:00",
        "cleared_at": null
      },
      {
        "id": 3,
        "event_id": 20000,
        "province_code": "GD",
        "province_name": "广东",
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "severity": 1,
        "child_status": "cleared",
        "event_title": "注册率异常",
        "joined_at": "2026-04-16 10:23:00",
        "cleared_at": "2026-04-16 10:35:00"
      }
    ],
    "severity_history": [
      { "time": "2026-04-16 10:23:00", "severity": 1, "reason": "初始生成，1省1条1级告警" },
      { "time": "2026-04-16 10:25:00", "severity": 1, "reason": "新子告警追加(广东AMF-GD-02)，等级不变" },
      { "time": "2026-04-16 10:28:00", "severity": 1, "reason": "新子告警追加(广西AMF-GX-01)，等级不变" }
    ],
    "no_manual_action": true
  }
}
```

**响应体（Pool级）差异字段**：

```json
{
  "agg_rule_id": 5001,
  "agg_type": "pool",
  "group_key": "Pool-GD-AMF-01",
  "group_name": "Pool-GD-AMF-01",
  "agg_value": 128450.0,
  "baseline_value": 145200.0,
  "trigger_config": {
    "rule_name": "AMF注册态用户数聚合",
    "agg_function": "sum",
    "baseline_type": "yesterday_same_period",
    "operator": "lt",
    "threshold_value": -10.0,
    "offset_percent": -11.5,
    "observe_window": 3
  }
}
```

### 3C.3 查询聚合视图（监控页专用）

**GET** `/derived-alarms/aggregate-view`

| 权限 | alarm:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| view_mode | string | 是 | list/aggregate |
| agg_dimension | string | 否 | region/pool/region_pool（view_mode=aggregate时必填） |
| severity | string | 否 | 告警等级筛选 |
| status | string | 否 | 衍生告警状态筛选 |
| start_time | datetime | 否 | 更新时间起始 |
| end_time | datetime | 否 | 更新时间结束 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应体（聚合视图，view_mode=aggregate, agg_dimension=region_pool）**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_regions": 3,
    "total_derived_alarms": 6,
    "regions": [
      {
        "region_code": "HN",
        "region_name": "华南大区",
        "alarm_count": 8,
        "max_severity": 1,
        "latest_time": "2026-04-16 10:28:00",
        "derived_alarms": [
          {
            "derived_id": 30001,
            "agg_type": "region",
            "event_title": "华南大区AMF注册成功率异常",
            "severity": 1,
            "child_count": 3,
            "active_child_count": 2,
            "updated_at": "2026-04-16 10:28:00"
          }
        ],
        "pools": [
          {
            "pool_name": "Pool-GD-AMF-01",
            "alarm_count": 3,
            "max_severity": 1,
            "latest_time": "2026-04-16 10:23:00",
            "derived_alarms": [
              {
                "derived_id": 30002,
                "agg_type": "pool",
                "event_title": "AMF注册态用户数下降",
                "severity": 1,
                "child_count": 2,
                "active_child_count": 2,
                "updated_at": "2026-04-16 10:23:00"
              }
            ],
            "original_alarms": [
              {
                "event_id": 20001,
                "ne_name": "AMF-GD-01",
                "event_title": "注册率异常",
                "severity": 1,
                "updated_at": "2026-04-16 10:23:00"
              },
              {
                "event_id": 20005,
                "ne_name": "AMF-GD-03",
                "event_title": "会话率波动",
                "severity": 2,
                "updated_at": "2026-04-16 10:26:00"
              }
            ]
          },
          {
            "pool_name": "Pool-GD-AMF-02",
            "alarm_count": 2,
            "max_severity": 2,
            "latest_time": "2026-04-16 10:25:00",
            "derived_alarms": [],
            "original_alarms": []
          }
        ]
      }
    ]
  }
}
```

### 3C.4 获取大区级全局配置

**GET** `/system-config/{config_key}`

| 权限 | rule:list |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| config_key | string | 配置键，如 region_agg_threshold |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "config_key": "region_agg_threshold",
    "config_value": {
      "min_provinces": 2,
      "time_window_minutes": 30
    },
    "description": "大区级聚合触发阈值：最少省份数 + 时间窗口",
    "updated_at": "2026-04-16 09:00:00"
  }
}
```

### 3C.5 更新大区级全局配置

**PUT** `/system-config/{config_key}`

| 权限 | rule:edit（仅集团运维） |
|------|------|

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| config_key | string | 配置键 |

**请求体**：

```json
{
  "config_value": {
    "min_provinces": 3,
    "time_window_minutes": 20
  }
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "config_key": "region_agg_threshold",
    "updated_at": "2026-04-22 10:00:00"
  }
}
```

---

## 四、效果模拟模块

### 4.1 规则效果模拟

**POST** `/rules/simulate`

| 权限 | rule:list |
|------|------|

**请求体**：

```json
{
  "conditions": [
    {
      "metric_code": "registration_rate",
      "metric_name": "注册成功率",
      "metric_unit": "percent",
      "threshold_type": "qoq",
      "operator": "lt",
      "threshold_value": -20.0
    }
  ],
  "logic_operator": "AND",
  "observe_window": 3,
  "recovery_window": 3,
  "ne_type": "AMF",
  "severity": 2,
  "simulation_range": "7d",
  "ne_scope": "all"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| conditions | 是 | 条件列表（同规则创建） |
| logic_operator | 是 | AND/OR |
| observe_window | 是 | 触发窗口 |
| recovery_window | 是 | 恢复窗口 |
| ne_type | 是 | 网元类型 |
| severity | 否 | 告警等级（用于推荐配置参考） |
| simulation_range | 是 | 模拟时间范围：1d/7d/30d |
| ne_scope | 否 | all 或指定网元ID列表 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "triggered_count": 12,
    "filtered_flash_count": 23,
    "filtered_normal_count": 47,
    "triggered_events": [
      {
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "triggered_at": "2026-04-12 10:23:00",
        "duration_minutes": 15,
        "severity": 2
      }
    ],
    "filtered_flash_events": [
      {
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "time": "2026-04-12 08:11:00",
        "abnormal_points": 1
      }
    ],
    "assessment": {
      "daily_avg_triggers": 1.7,
      "flash_filter_rate": 0.66,
      "max_duration_minutes": 45,
      "max_duration_ne": "AMF-HN-03",
      "recommendation": "日均告警频率合理，闪断过滤率66%窗口配置有效"
    }
  }
}
```

### 4.2 已有规则效果模拟

**POST** `/rules/{rule_id}/simulate`

| 权限 | rule:list |
|------|------|

**请求体**：

```json
{
  "simulation_range": "7d",
  "ne_scope": "all"
}
```

**响应体**：同 4.1

---

## 五、指标报表模块

### 5.1 查询指标数据

**GET** `/metrics/query`

| 权限 | report:view |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| province_code | string | 否 | 省份编码（集团用户可用） |
| major | string | 否 | 专业 |
| ne_type | string | 否 | 网元类型 |
| vendor | string | 否 | 厂商 |
| ne_ids | string | 否 | 网元ID列表，逗号分隔（最多10个） |
| metric_codes | string | 否 | 指标编码列表，逗号分隔 |
| start_time | datetime | 是 | 开始时间 |
| end_time | datetime | 是 | 结束时间 |
| compare_mode | string | 否 | 对比模式：same_province_type/same_pool/custom |
| page | int | 否 | 页码（表格模式） |
| page_size | int | 否 | 每页条数 |

**响应体（折线图模式）**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "metric_unit": "percent",
    "series": [
      {
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "metric_code": "registration_rate",
        "metric_name": "注册成功率",
        "data_points": [
          { "time": "2026-04-16 00:00:00", "value": 98.5 },
          { "time": "2026-04-16 00:01:00", "value": 98.3 },
          { "time": "2026-04-16 00:02:00", "value": 87.3, "is_alarm": true },
          { "time": "2026-04-16 00:03:00", "value": 85.1, "is_alarm": true },
          { "time": "2026-04-16 00:04:00", "value": 84.7, "is_alarm": true }
        ]
      }
    ],
    "threshold_lines": [
      {
        "rule_id": 1001,
        "rule_name": "AMF注册成功率异常监控",
        "metric_code": "registration_rate",
        "threshold_type": "absolute",
        "threshold_value": 95.0,
        "operator": "lt"
      }
    ],
    "alarm_zones": [
      {
        "rule_id": 1001,
        "start_time": "2026-04-16 10:23:00",
        "end_time": "2026-04-16 10:38:00",
        "severity": 2
      }
    ]
  }
}
```

**响应体（表格模式）**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 8500,
    "page": 1,
    "page_size": 50,
    "columns": [
      { "key": "ne_name", "title": "网元名称", "width": 160 },
      { "key": "registration_rate", "title": "注册成功率", "width": 120 },
      { "key": "session_setup_rate", "title": "会话建立率", "width": 120 },
      { "key": "handover_rate", "title": "切换成功率", "width": 120 },
      { "key": "alarm_status", "title": "状态", "width": 80 }
    ],
    "list": [
      {
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "registration_rate": { "value": 87.3, "is_alarm": true },
        "session_setup_rate": { "value": 98.2, "is_alarm": false },
        "handover_rate": { "value": 99.1, "is_alarm": false },
        "alarm_status": "alarm",
        "alarm_severity": 2
      }
    ]
  }
}
```

### 5.2 查询指标摘要卡片

**GET** `/metrics/summary`

| 权限 | report:view |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| province_code | string | 否 | 省份编码 |
| ne_type | string | 否 | 网元类型 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "alarm_ne_count": 23,
    "normal_ne_count": 7977,
    "top5_alarms": [
      {
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "ne_type": "AMF",
        "severity": 1,
        "event_title": "注册成功率异常"
      },
      {
        "ne_id": "NE-UPF-GD-003",
        "ne_name": "UPF-GD-03",
        "ne_type": "UPF",
        "severity": 1,
        "event_title": "会话建立率低"
      }
    ],
    "anomaly_trend": [
      { "time": "2026-04-16 10:00:00", "count": 5 },
      { "time": "2026-04-16 10:15:00", "count": 8 },
      { "time": "2026-04-16 10:30:00", "count": 12 },
      { "time": "2026-04-16 10:45:00", "count": 9 },
      { "time": "2026-04-16 11:00:00", "count": 7 }
    ]
  }
}
```

### 5.3 查询指标分布（阈值可视化参考）

**GET** `/metrics/distribution`

| 权限 | report:view |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ne_type | string | 是 | 网元类型 |
| metric_code | string | 是 | 指标编码 |
| period | string | 否 | 统计时段：24h/7d，默认24h |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "metric_code": "registration_rate",
    "metric_name": "注册成功率",
    "metric_unit": "percent",
    "percentiles": {
      "p5": 94.2,
      "p25": 97.1,
      "p50": 98.5,
      "p75": 99.1,
      "p95": 99.7
    },
    "sample_count": 1440,
    "threshold_coverage": 2.1,
    "threshold_coverage_description": "当前阈值将覆盖约2.1%的采集点(历史统计)"
  }
}
```

---

## 六、监控报表模块

### 6.1 查询告警事件列表

**GET** `/alarms`

| 权限 | alarm:list |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| province_code | string | 否 | 省份编码 |
| major | string | 否 | 专业 |
| ne_type | string | 否 | 网元类型 |
| vendor | string | 否 | 厂商 |
| ne_name | string | 否 | 网元名称模糊搜索 |
| severity | string | 否 | 告警等级：1/2/3/4，逗号分隔多选 |
| status | string | 否 | 事件状态，逗号分隔 |
| start_time | datetime | 否 | 更新时间起始 |
| end_time | datetime | 否 | 更新时间结束 |
| group_by | string | 否 | 聚合模式：ne/pool/region/region_pool，不传则为普通列表 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |
| sort_by | string | 否 | 排序字段，默认 updated_at |
| sort_order | string | 否 | asc/desc，默认 desc |

**响应体（普通列表模式）**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 28,
    "page": 1,
    "page_size": 20,
    "severity_summary": {
      "1": 3,
      "2": 8,
      "3": 12,
      "4": 5
    },
    "list": [
      {
        "event_id": 20001,
        "ne_id": "NE-AMF-GD-001",
        "ne_name": "AMF-GD-01",
        "ne_type": "AMF",
        "biz_type": "5G",
        "province_code": "GD",
        "province_name": "广东",
        "event_title": "注册成功率异常",
        "event_detail": "注册成功率环比下降22.5%，当前值87.3%，阈值-20%",
        "severity": 1,
        "status": "pending",
        "started_at": "2026-04-16 10:23:00",
        "updated_at": "2026-04-16 11:06:00",
        "duration_minutes": 43,
        "handler": "李四"
      }
    ]
  }
}
```

**响应体（聚合模式 group_by=pool）**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 8,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "group_key": "Pool-GD-AMF-01",
        "group_name": "Pool-GD-AMF-01",
        "alarm_count": 5,
        "max_severity": 1,
        "latest_time": "2026-04-16 10:25:00",
        "children": [
          {
            "event_id": 20001,
            "ne_name": "AMF-GD-01",
            "event_title": "注册成功率异常",
            "severity": 1,
            "updated_at": "2026-04-16 10:23:00"
          }
        ]
      }
    ]
  }
}
```

### 6.2 获取告警事件详情

**GET** `/alarms/{event_id}`

| 权限 | alarm:list |
|------|------|

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "event_id": 20001,
    "ne_id": "NE-AMF-GD-001",
    "ne_name": "AMF-GD-01",
    "ne_type": "AMF",
    "biz_type": "5G",
    "province_code": "GD",
    "province_name": "广东",
    "event_title": "注册成功率异常",
    "event_detail": "注册成功率环比下降22.5%，当前值87.3%，阈值-20%",
    "severity": 1,
    "status": "pending",
    "trigger_value": 87.3,
    "trigger_threshold": -20.0,
    "started_at": "2026-04-16 10:23:00",
    "updated_at": "2026-04-16 11:06:00",
    "duration_minutes": 43,
    "handler": "李四",
    "handle_note": null,
    "resolved_at": null,
    "rule": {
      "rule_id": 1001,
      "rule_name": "AMF注册成功率异常监控",
      "conditions": [
        {
          "metric_code": "registration_rate",
          "metric_name": "注册成功率",
          "threshold_type": "qoq",
          "operator": "lt",
          "threshold_value": -20.0
        }
      ],
      "observe_window": 3
    },
    "related_alarms": [
      {
        "event_id": 20002,
        "ne_name": "AMF-GD-02",
        "event_title": "注册率下降",
        "severity": 2,
        "updated_at": "2026-04-16 10:25:00"
      }
    ],
    "sop_template": "1. 检查AMF进程状态 (ps/top)\n2. 查看注册接口S1-MME日志\n3. 检查HSS/UDM连接状态\n4. 如持续异常，联系华为支持(400-xxx-xxxx)"
  }
}
```

### 6.3 确认告警

**PUT** `/alarms/{event_id}/confirm`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "handle_note": "已确认，正在排查AMF进程状态"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| handle_note | 是 | 处理说明，最少5字 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "event_id": 20001,
    "status": "confirmed"
  }
}
```

### 6.4 标记误报

**PUT** `/alarms/{event_id}/false-alarm`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "handle_note": "经排查为割接操作导致，非故障"
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "event_id": 20001,
    "status": "false_alarm"
  }
}
```

### 6.5 转派告警

**PUT** `/alarms/{event_id}/transfer`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "transfer_to": "u002",
  "handle_note": "转派给王五处理，其负责AMF设备"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| transfer_to | 是 | 目标处理人用户ID（同省份运维人员） |
| handle_note | 是 | 转派说明 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "event_id": 20001,
    "status": "pending",
    "handler": "王五"
  }
}
```

### 6.6 升级告警

**PUT** `/alarms/{event_id}/escalate`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "handle_note": "影响范围扩大，需升级处理",
  "target_severity": 1
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| handle_note | 是 | 升级说明 |
| target_severity | 否 | 升级后等级（需高于当前等级） |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "event_id": 20001,
    "severity": 1
  }
}
```

### 6.7 关闭告警

**PUT** `/alarms/{event_id}/close`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "handle_note": "指标已恢复正常，关闭告警"
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "event_id": 20001,
    "status": "closed",
    "resolved_at": "2026-04-16 12:00:00"
  }
}
```

### 6.8 批量确认告警

**PUT** `/alarms/batch-confirm`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "event_ids": [20001, 20002, 20003],
  "handle_note": "批量确认，同一故障引起"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| event_ids | 是 | 事件ID数组，最多50个 |
| handle_note | 是 | 处理说明 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 3,
    "fail_count": 0
  }
}
```

### 6.9 批量转派告警

**PUT** `/alarms/batch-transfer`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "event_ids": [20001, 20002],
  "transfer_to": "u002",
  "handle_note": "批量转派给AMF专项组"
}
```

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 2,
    "fail_count": 0
  }
}
```

### 6.10 批量标记误报

**PUT** `/alarms/batch-false-alarm`

| 权限 | alarm:confirm |
|------|------|

**请求体**：

```json
{
  "event_ids": [20005, 20006],
  "handle_note": "割接引起，批量标记误报"
}
```

**响应体**：同批量确认

---

## 七、数据导出模块

### 7.1 创建导出任务

**POST** `/exports`

| 权限 | report:export / alarm:export |
|------|------|

**请求体（指标报表导出）**：

```json
{
  "export_type": "metric_report",
  "params": {
    "province_code": "GD",
    "ne_type": "AMF",
    "ne_ids": ["NE-AMF-GD-001"],
    "metric_codes": ["registration_rate", "session_setup_rate"],
    "start_time": "2026-04-15 00:00:00",
    "end_time": "2026-04-16 00:00:00",
    "include_alarm_marks": true
  }
}
```

**请求体（告警事件导出）**：

```json
{
  "export_type": "alarm_event",
  "params": {
    "province_code": "GD",
    "ne_type": "AMF",
    "severity": "1,2",
    "start_time": "2026-04-15 00:00:00",
    "end_time": "2026-04-16 00:00:00"
  }
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| export_type | 是 | metric_report / alarm_event |
| params | 是 | 导出参数（与对应查询接口筛选参数一致） |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "export_20260416_001",
    "status": "processing",
    "estimated_rows": 14400,
    "estimated_seconds": 15
  }
}
```

### 7.2 查询导出任务状态

**GET** `/exports/{task_id}`

| 权限 | report:export / alarm:export |
|------|------|

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "export_20260416_001",
    "export_type": "metric_report",
    "status": "completed",
    "progress": 100,
    "total_rows": 14400,
    "file_name": "黄金指标报表_20260416.xlsx",
    "file_size": "2.3MB",
    "download_url": "/api/v1/exports/export_20260416_001/download?token=xxx",
    "download_expires_at": "2026-04-16 19:00:00",
    "created_at": "2026-04-16 18:00:00",
    "completed_at": "2026-04-16 18:00:12"
  }
}
```

| status | 说明 |
|--------|------|
| pending | 等待中 |
| processing | 处理中 |
| completed | 已完成 |
| failed | 失败 |
| cancelled | 已取消 |

### 7.3 下载导出文件

**GET** `/exports/{task_id}/download`

| 权限 | report:export / alarm:export |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 下载令牌（从任务状态响应获取，有效期1小时） |

**响应**：文件流（Content-Type: application/octet-stream）

### 7.4 取消导出任务

**PUT** `/exports/{task_id}/cancel`

| 权限 | report:export / alarm:export |
|------|------|

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "export_20260416_001",
    "status": "cancelled"
  }
}
```

### 7.5 查询导出任务列表

**GET** `/exports`

| 权限 | report:export / alarm:export |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| export_type | string | 否 | 导出类型筛选 |
| status | string | 否 | 状态筛选 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "page_size": 10,
    "list": [
      {
        "task_id": "export_20260416_001",
        "export_type": "metric_report",
        "status": "completed",
        "total_rows": 14400,
        "file_name": "黄金指标报表_20260416.xlsx",
        "download_url": "/api/v1/exports/export_20260416_001/download?token=xxx",
        "created_at": "2026-04-16 18:00:00"
      }
    ]
  }
}
```

---

## 八、公共数据模块

### 8.1 获取网元类型列表

**GET** `/common/ne-types`

| 权限 | 已认证用户 |
|------|------|

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "code": "AMF", "name": "AMF", "metric_count": 10 },
    { "code": "SMF", "name": "SMF", "metric_count": 10 },
    { "code": "UPF", "name": "UPF", "metric_count": 10 }
  ]
}
```

### 8.2 获取指标列表（按网元类型）

**GET** `/common/metrics`

| 权限 | 已认证用户 |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ne_type | string | 是 | 网元类型 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "metric_code": "registration_rate",
      "metric_name": "注册成功率",
      "metric_unit": "percent",
      "description": "AMF注册成功次数/总注册请求次数×100%"
    },
    {
      "metric_code": "session_setup_rate",
      "metric_name": "会话建立率",
      "metric_unit": "percent",
      "description": "会话建立成功次数/总会话建立请求×100%"
    },
    {
      "metric_code": "n2_interface_delay",
      "metric_name": "N2接口延迟",
      "metric_unit": "value",
      "description": "N2接口平均响应时延(ms)"
    }
  ]
}
```

### 8.3 获取筛选器选项（级联数据）

**GET** `/common/filter-options`

| 权限 | 已认证用户 |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| province_code | string | 否 | 已选省份（联动过滤后续选项） |
| major | string | 否 | 已选专业 |
| ne_type | string | 否 | 已选网元类型 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "provinces": [
      { "code": "GD", "name": "广东" },
      { "code": "BJ", "name": "北京" }
    ],
    "majors": [
      { "code": "5G", "name": "5G" },
      { "code": "4G", "name": "4G" }
    ],
    "ne_types": [
      { "code": "AMF", "name": "AMF" },
      { "code": "SMF", "name": "SMF" }
    ],
    "vendors": [
      { "code": "huawei", "name": "华为" },
      { "code": "zte", "name": "中兴" },
      { "code": "ericsson", "name": "爱立信" }
    ]
  }
}
```

### 8.4 搜索网元

**GET** `/common/ne-search`

| 权限 | 已认证用户 |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（名称或ID模糊匹配） |
| province_code | string | 否 | 省份 |
| ne_type | string | 否 | 网元类型 |
| limit | int | 否 | 返回条数，默认20，最大50 |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "ne_id": "NE-AMF-GD-001",
      "ne_name": "AMF-GD-01",
      "ne_type": "AMF",
      "province_code": "GD",
      "province_name": "广东",
      "vendor": "huawei",
      "pool_name": "Pool-GD-AMF-01"
    }
  ]
}
```

### 8.5 获取运维人员列表（转派用）

**GET** `/common/operators`

| 权限 | alarm:confirm |
|------|------|

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| province_code | string | 否 | 省份筛选（默认当前用户省份） |

**响应体**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "user_id": "u002",
      "display_name": "王五",
      "role": "PROVINCE_OPERATOR",
      "province_code": "GD"
    }
  ]
}
```

---

## 九、WebSocket 推送

### 9.1 连接

```
ws://<host>/api/v1/ws?token=<jwt_token>
```

### 9.2 消息格式

**服务端推送消息**：

```json
{
  "type": "alarm.new",
  "data": {
    "event_id": 20005,
    "ne_name": "AMF-GD-04",
    "event_title": "注册成功率异常",
    "severity": 1,
    "started_at": "2026-04-16 11:30:00"
  },
  "timestamp": 1713264600000
}
```

### 9.3 消息类型

| type | 说明 | 推送条件 | data 内容 |
|------|------|----------|-----------|
| `alarm.new` | 新告警事件 | 有新告警触发 | 事件摘要 |
| `alarm.update` | 告警状态变更 | 告警确认/关闭/转派等 | 事件ID + 新状态 |
| `alarm.recover` | 告警恢复 | 指标恢复正常 | 事件ID + 恢复时间 |
| `derived_alarm.new` | 新衍生告警 | 大区级/Pool级衍生告警生成 | 衍生告警摘要 |
| `derived_alarm.update` | 衍生告警更新 | 子告警追加/等级升级/状态变更 | 衍生告警ID + 变更类型 + 新状态 |
| `derived_alarm.child_append` | 子告警追加 | 新告警追加到已有衍生告警 | 衍生告警ID + 子告警信息 |
| `derived_alarm.clear` | 衍生告警清除 | 所有子告警已清除 | 衍生告警ID + 清除时间 |
| `summary.refresh` | 摘要数据刷新 | 每30秒 | 告警摘要统计 |
| `export.completed` | 导出完成 | 异步导出任务完成 | 任务ID + 下载链接 |
| `system.status` | 系统状态 | 系统异常/恢复 | 状态信息 |

### 9.4 心跳

- 客户端每30秒发送 `{"type": "ping"}`
- 服务端回复 `{"type": "pong"}`
- 超过60秒无心跳，服务端断开连接

---

## 十、接口权限汇总

| 接口 | 方法 | 最小权限 | 说明 |
|------|------|----------|------|
| `/auth/login` | POST | 无需认证 | 登录 |
| `/auth/refresh` | POST | 无需认证 | 刷新Token |
| `/auth/me` | GET | 已认证 | 用户信息 |
| `/rules` | GET | rule:list | 规则列表 |
| `/rules` | POST | rule:create | 创建规则 |
| `/rules/{id}` | GET | rule:list | 规则详情 |
| `/rules/{id}` | PUT | rule:edit | 更新规则 |
| `/rules/{id}` | DELETE | rule:delete | 删除规则 |
| `/rules/batch-status` | PUT | rule:edit | 批量启用/停用 |
| `/rules/batch` | DELETE | rule:delete | 批量删除 |
| `/rules/check-name` | GET | rule:list | 名称唯一性检查 |
| `/agg-rules` | GET | rule:list | 聚合规则列表 |
| `/agg-rules` | POST | rule:create | 创建聚合规则 |
| `/agg-rules/{id}` | GET | rule:list | 聚合规则详情 |
| `/agg-rules/{id}` | PUT | rule:edit | 更新聚合规则 |
| `/agg-rules/{id}` | DELETE | rule:delete | 删除聚合规则 |
| `/agg-rules/batch-status` | PUT | rule:edit | 批量启用/停用聚合规则 |
| `/agg-rules/check-name` | GET | rule:list | 聚合规则名称唯一性检查 |
| `/derived-alarms` | GET | alarm:list | 衍生告警列表 |
| `/derived-alarms/{id}` | GET | alarm:list | 衍生告警详情 |
| `/derived-alarms/aggregate-view` | GET | alarm:list | 聚合视图 |
| `/system-config/{key}` | GET | rule:list | 获取全局配置 |
| `/system-config/{key}` | PUT | rule:edit | 更新全局配置 |
| `/rules/simulate` | POST | rule:list | 效果模拟 |
| `/rules/{id}/simulate` | POST | rule:list | 已有规则模拟 |
| `/templates` | GET | rule:list | 模板列表 |
| `/templates/{id}` | GET | rule:list | 模板详情 |
| `/templates/{id}/create-rule` | POST | rule:create | 从模板创建规则 |
| `/metrics/query` | GET | report:view | 指标查询 |
| `/metrics/summary` | GET | report:view | 摘要卡片 |
| `/metrics/distribution` | GET | report:view | 指标分布 |
| `/alarms` | GET | alarm:list | 告警列表 |
| `/alarms/{id}` | GET | alarm:list | 告警详情 |
| `/alarms/{id}/confirm` | PUT | alarm:confirm | 确认告警 |
| `/alarms/{id}/false-alarm` | PUT | alarm:confirm | 标记误报 |
| `/alarms/{id}/transfer` | PUT | alarm:confirm | 转派告警 |
| `/alarms/{id}/escalate` | PUT | alarm:confirm | 升级告警 |
| `/alarms/{id}/close` | PUT | alarm:confirm | 关闭告警 |
| `/alarms/batch-confirm` | PUT | alarm:confirm | 批量确认 |
| `/alarms/batch-transfer` | PUT | alarm:confirm | 批量转派 |
| `/alarms/batch-false-alarm` | PUT | alarm:confirm | 批量标记误报 |
| `/exports` | POST | report:export/alarm:export | 创建导出 |
| `/exports` | GET | report:export/alarm:export | 导出列表 |
| `/exports/{id}` | GET | report:export/alarm:export | 导出状态 |
| `/exports/{id}/download` | GET | report:export/alarm:export | 下载文件 |
| `/exports/{id}/cancel` | PUT | report:export/alarm:export | 取消导出 |
| `/common/ne-types` | GET | 已认证 | 网元类型 |
| `/common/metrics` | GET | 已认证 | 指标列表 |
| `/common/filter-options` | GET | 已认证 | 筛选器选项 |
| `/common/ne-search` | GET | 已认证 | 网元搜索 |
| `/common/operators` | GET | alarm:confirm | 运维人员 |

---

## 十一、接口清单统计

| 模块 | 接口数量 |
|------|----------|
| 认证 | 3 |
| 规则配置 | 8 |
| 聚合规则 | 7 |
| 衍生告警 | 5 |
| 规则模板 | 3 |
| 效果模拟 | 2 |
| 指标报表 | 3 |
| 监控报表 | 10 |
| 数据导出 | 5 |
| 公共数据 | 5 |
| WebSocket | 1 |
| **合计** | **52** |
