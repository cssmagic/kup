# 集成测试用例

## 基础功能测试

### 显示版本号

```sh
kup --version
```

```sh
kup -v
```

### 显示帮助信息

```sh
kup --help
```

```sh
kup -h
```



## 发布新 Issue

### 通过参数指定仓库

> * 目标仓库：`cssmagic/kup-demo3`

```sh
kup --repo cssmagic/kup-demo3 ./stuff/no-meta.md
```

### 通过元数据指定仓库

> * 目标仓库：`cssmagic/kup-demo2`

```sh
kup ./stuff/meta--no-id.md
```

### 通过 `package.json` 的 `kup.repo` 字段指定仓库

> * 目标仓库：`cssmagic/kup-demo`

```sh
kup ./stuff/no-meta.md
```

### 通过 `package.json` 的 `repository` 字段猜测仓库

> * 目标仓库：`cssmagic/kup-demo2`

```sh
kup ./stuff/package-json-repository/no-meta.md
```


## 更新已有 Issue

### 通过参数指定仓库和 Issue ID

> * 目标仓库：`cssmagic/kup-demo3`
> * Issue ID：3

```sh
kup --repo cssmagic/kup-demo3 --id 3 ./stuff/meta--full.md
```

### 通过元数据指定仓库和 Issue ID

> * 目标仓库：`cssmagic/kup-demo2`
> * Issue ID：2

```sh
kup ./stuff/meta--full.md
```

### 通过 `package.json` 指定仓库，通过元数据指定 Issue ID

> * 目标仓库：`cssmagic/kup-demo`
> * Issue ID：1

```sh
kup ./stuff/meta--no-repo.md
```
