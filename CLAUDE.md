**团队代码编写规范（清晰·无歧义·可执行）**

---

## 一、写给人看的代码

**核心原则**：代码首先是写给人看的，其次才是给机器执行的。

**执行策略**：

1. **单一职责**：每个函数只做一件事。如果一个函数需要用"和"来描述功能，就拆分它。
2. **命名规则**：
   - 函数名：动词开头，描述行为，如 `calculate_total_price()`、`validate_user_input()`
   - 变量名：名词，描述内容，如 `customer_list`、`order_id`
   - 禁止缩写：写全称，`user_name` 而非 `usrNm`
3. **文件命名**：全部小写，单词间用下划线分隔，如 `user_manager.py`、`order_service.py`

**判断标准**：任何人打开代码文件，10 秒内能说出这段代码的作用。

---

## 二、让逻辑像故事一样顺

**核心原则**：代码逻辑应该是线性的、可预测的，像读故事一样自然。

**执行策略**：

1. **限制嵌套深度**：最多 3 层嵌套。超过 3 层必须提取成独立函数。
2. **复杂条件必须命名**：

python

```python
   # 错误示范
   if user.age > 18 and user.status == 'active' and user.balance > 0:

   # 正确示范
   is_eligible_user = user.age > 18 and user.status == 'active' and user.balance > 0
   if is_eligible_user:
```

3. **使用早返回**：条件不满足时立即返回，避免深层嵌套：

python

```python
   def process_order(order):
       if not order:
           return None
       if not order.is_valid():
           return None
       # 主要逻辑在这里
       return result
```

**判断标准**：从上到下读代码，不需要在脑子里维护超过 3 个条件分支。

---

## 三、代码即文档

**核心原则**：代码本身就是最好的文档，注释只是辅助。

**执行策略**：

1. **函数必须有文档字符串**：

python

```python
   def calculate_discount(price: float, discount_rate: float) -> float:
       """
       计算折扣后的价格

       参数:
           price: 原价，必须大于0
           discount_rate: 折扣率，范围0-1

       返回:
           折扣后的价格
       """
       return price * (1 - discount_rate)
```

2. **模块必须有顶部说明**：

python

```python
   """
   用户管理模块

   负责用户的创建、更新、删除和查询操作
   """
```

3. **禁止写无用注释**：

python

```python
   # 错误：i = i + 1  # i加1
   # 正确：current_index += 1  # 移动到下一个待处理项
```

**判断标准**：删掉所有注释后，代码仍然能被理解。

---

## 四、可测试、可复用

**核心原则**：函数应该是纯粹的输入输出转换器。

**执行策略**：

1. **禁止依赖全局变量**：所有需要的数据通过参数传入。
2. **隔离副作用**：
   - 函数内部不直接打印、写文件、发送网络请求
   - 把副作用操作抽到专门的函数中
   - 主逻辑函数只负责计算和返回结果
3. **明确输入输出**：

python

```python
   # 错误：修改传入的参数
   def update_user(user):
       user.name = "new_name"

   # 正确：返回新对象
   def update_user(user, new_name):
       updated_user = user.copy()
       updated_user.name = new_name
       return updated_user
```

4. **必须编写单元测试**：每个函数至少有一个测试用例，测试文件名为 `test_模块名.py`

**判断标准**：函数可以在没有任何外部依赖的情况下独立测试通过。

---

## 五、出错要早，提示要准

**核心原则**：问题越早暴露越好，错误信息越具体越好。

**执行策略**：

1. **参数校验放在函数开头**：

python

```python
   def create_order(user_id, amount):
       if user_id <= 0:
           raise ValueError(f"无效的用户ID: {user_id}")
       if amount <= 0:
           raise ValueError(f"金额必须大于0，当前值: {amount}")
       # 业务逻辑
```

2. **日志必须包含上下文**：

python

```python
   # 错误：logger.error("创建失败")
   # 正确：
   logger.error(f"订单创建失败 | 用户ID: {user_id} | 金额: {amount} | 错误: {str(e)}")
```

3. **异常必须有具体类型**：不要只抛出 `Exception`，使用具体的异常类型如 `ValueError`、`TypeError`。

**判断标准**：看到错误信息后，能在 30 秒内定位到出错的具体位置和原因。

---

## 六、一致性比完美更重要

**核心原则**：整个项目的代码看起来像一个人写的。

**执行策略**：

1. **强制使用格式化工具**：
   - 代码格式化：`ruff format`（提交前自动运行）
   - 代码检查：`ruff check`（CI 流程必须通过）
   - 类型检查：`mypy` 或 `pyright`（逐步引入）
2. **统一导入顺序**：

python

```python
   # 1. 标准库
   import os
   import sys

   # 2. 第三方库
   import numpy as np

   # 3. 本地模块
   from .utils import helper
```

3. **统一配置文件**：
   - 项目根目录必须有 `pyproject.toml` 或 `setup.cfg`
   - 所有工具配置写在同一个文件中

**判断标准**：新人提交的代码，在格式上和老代码没有区别。

---

## 七、能删的才是好代码

**核心原则**：模块之间的耦合度越低越好，任何部分都可以随时替换。

**执行策略**：

1. **配置与代码分离**：
   - 所有路径、密钥、配置项放在环境变量或配置文件中
   - 代码中使用 `os.getenv()` 或配置管理库读取
   - 禁止硬编码任何环境相关的值
2. **模块依赖最小化**：
   - 一个模块只依赖它直接需要的其他模块
   - 禁止循环依赖
   - 使用依赖注入而不是直接导入
3. **保持模块独立**：每个模块应该能单独拿出来在其他项目中使用。

**判断标准**：删除一个模块或替换一个依赖库，只需要修改不超过 3 个文件。

---

## 八、数据结构是核心

**核心原则**：烂程序员关心代码，好程序员关心数据结构。

**执行策略**：

1. **先设计数据结构，再写代码**：
   - 写任何逻辑前，先用注释或文档列出所有数据结构
   - 画出数据之间的关系图
   - 确定每个数据的字段、类型、约束条件
2. **使用明确的数据类型**：

python

```python
   # 错误：用字典混杂不同类型的数据
   user = {"name": "张三", "age": 25, "orders": [...]}

   # 正确：使用dataclass或类
   from dataclasses import dataclass

   @dataclass
   class User:
       name: str
       age: int
       orders: list[Order]
```

3. **数据结构必须符合直觉**：
   - 一对多关系：用列表
   - 唯一查找：用字典
   - 有序序列：用列表或元组
   - 不可变数据：用元组或冻结的 dataclass

**判断标准**：看到数据结构定义后，不用看代码就能猜到 90%的操作逻辑。

---

## 九、接口是契约，不是摆设

**核心原则**：接口定义了能做什么，实现展示了怎么做。接口一旦定义就不能随意改变。

**执行策略**：

1. **明确定义函数签名**：

python

```python
   def fetch_user_data(user_id: int) -> dict[str, any]:
       """
       获取用户数据

       参数:
           user_id: 用户ID，必须大于0

       返回:
           包含用户信息的字典，包含 name, age, email 字段

       异常:
           ValueError: 当user_id无效时
           DatabaseError: 当数据库连接失败时
       """
```

2. **隐藏实现细节**：
   - 调用者不需要知道你用的是 MySQL 还是 PostgreSQL
   - 调用者不需要知道你内部的缓存机制
   - 只暴露必要的接口，其他都标记为私有（用下划线开头）
3. **依赖抽象接口**：

python

```python
   # 错误：直接依赖具体实现
   from mysql_client import MySQLDatabase
   db = MySQLDatabase()

   # 正确：依赖抽象接口
   from database import Database
   db: Database = get_database()  # 具体是什么数据库由配置决定
```

**判断标准**：修改函数内部实现时，所有调用该函数的代码都不需要改动。

- 使用命令行需要激活虚拟环境
- 使用 uv 管理虚拟环境
