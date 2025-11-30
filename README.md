# 🚗 Amemiya • Sistema de Gestão de Manutenção de Veículos

O Amemiya é um sistema completo para controle de manutenção automotiva, criado em HTML, CSS, JavaScript e PHP, integrando gráficos, relatórios e cadastro de veículos, fornecedores e lançamentos.  
Desenvolvido para ser rápido, simples e totalmente funcional tanto localmente quanto futuramente hospedado em um servidor real.

---

## ✨ Funcionalidades Principais

### 📊 Dashboard
- Gasto total do período  
- Custo por quilômetro  
- Taxa de aprovação  
- Tempo médio de aprovação  
- Gráfico de tendência de gastos  
- Gráfico de categorias por gasto  

### 🧾 Lançamentos
- Visualização completa das notas fiscais  
- Filtros por data, categoria, fornecedor, status e texto  
- Busca instantânea  
- Exportação para CSV  
- Tabela completa com observações  

### 🚘 Veículos
- Resumo de frota  
- Placa, modelo, km, gasto total  
- Última manutenção realizada  

### 📑 Relatórios
- Gasto por categoria  
- Gasto por veículo  
- Ticket médio  
- Quantidade de lançamentos  
- Filtros por data e status  

### 🛠️ Admin (em desenvolvimento)
- Cadastro de veículos  
- Cadastro de fornecedores  
- Cadastro de tipos de manutenção  
- Painéis de administração modernos e organizados  

---

## 📂 Estrutura do Projeto

```
/amemiya
 ├── index.html
 ├── dashboard.html
 ├── css/
 │    └── style.css
 ├── js/
 │    └── app.js
 ├── php/
 │    ├── conexao.php
 │    ├── login.php
 │    ├── logout.php
 │    ├── me.php
 │    ├── metrics.php
 │    ├── lancamentos.php
 │    ├── veiculos_resumo.php
 │    └── (futuros arquivos admin)
 ├── assets/
 │    └── logo_amemiya.png
 └── README.md
```

---

## 🧱 Tecnologias Utilizadas

### Frontend
- HTML5  
- CSS3  
- JavaScript  
- Chart.js  

### Backend
- PHP 7+  
- MySQL / MariaDB  
- Sessões e autenticação por cookies  

### Ferramentas
- XAMPP  
- Git / GitHub  
- VS Code  

---

## ⚙️ Como Rodar o Projeto Localmente

### 1️⃣ Clonar o repositório
```
git clone https://github.com/SEU-USUARIO/amemiya-dashboard.git
cd amemiya-dashboard
```

### 2️⃣ Configurar MySQL
Crie as tabelas necessárias:

- usuarios  
- veiculos  
- fornecedores  
- tipos_manutencao  
- notas_fiscais  

E configure a conexão no arquivo:

```
php/conexao.php
```

### 3️⃣ Rodar com XAMPP
Coloque o projeto em:

```
C:\xampp\htdocs\amemiya
```

Ligue Apache e MySQL e acesse:

```
http://localhost/amemiya/index.html
```

---

## 🔮 Melhorias Futuras
- CRUD completo no Admin  
- API REST para integração com app mobile  
- Upload de arquivos (notas, imagens)  
- Deploy no Azure ou VPS  
- Controle de permissões (admin / usuário)  

---
