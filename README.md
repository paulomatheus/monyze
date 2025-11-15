# 💰 Monyze - Progressive Web App de Controle Financeiro

![Status](https://img.shields.io/badge/status-completed-success)
![PWA](https://img.shields.io/badge/PWA-ready-blue)
![Version](https://img.shields.io/badge/version-1.0.0-purple)

> Aplicativo web progressivo para gerenciamento de finanças pessoais, funcionando 100% offline.

[📱 Ver Demo](https://paulomatheus.github.io/monyze/) | [📖 Documentação](#funcionalidades)

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Requisitos Acadêmicos](#requisitos-acadêmicos)
- [Capturas de Tela](#capturas-de-tela)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

**Monyze** (Money + Analyze) é uma Progressive Web App desenvolvida como projeto acadêmico da disciplina **DM122 - Desenvolvimento de Aplicativos Híbridos**. O objetivo é demonstrar conhecimentos práticos em:

- Service Workers
- Cache API
- IndexedDB
- Manifest.json
- Desenvolvimento offline-first

O aplicativo permite controlar receitas e despesas de forma simples e intuitiva, com gráficos interativos e funcionalidade completa mesmo sem conexão à internet.

---

## ✨ Funcionalidades

### 🏠 Dashboard
- Cards de resumo (Receitas, Despesas, Saldo)
- Gráfico de barras de despesas por categoria
- Histórico recente das últimas transações
- Botão rápido para adicionar transação

### 📋 Histórico
- Lista completa de todas as transações
- Agrupamento inteligente por data (Hoje, Ontem, Esta Semana, etc)
- Busca em tempo real por descrição ou categoria
- Filtros por tipo (Todas, Receitas, Despesas)
- Destaque visual dos resultados da busca

### 📊 Relatórios
- Filtros por período (Este Mês, Últimos 3 Meses, Este Ano, Tudo)
- Cards estatísticos detalhados
- Gráfico de pizza de despesas por categoria
- Gráfico de linha de receitas vs despesas ao longo do tempo
- Top 5 categorias com mais gastos
- Exportação para CSV (apenas período filtrado)

### 🏷️ Categorias
- Visão geral de todas as categorias
- Estatísticas por categoria
- Gráfico de pizza da distribuição
- Detalhes individuais (total, média, quantidade de transações)

### ⚙️ Configurações
- Tema escuro/claro com persistência
- Exportar TODAS as transações para CSV
- Limpar todos os dados
- Estatísticas gerais do app

### ℹ️ Sobre
- Informações do aplicativo
- Tecnologias utilizadas
- Requisitos acadêmicos atendidos
- Licença

### 🎨 Recursos Adicionais
- ✏️ Editar transações existentes
- 🗑️ Deletar transações
- 📱 Instalável como app nativo
- 🌙 Modo escuro
- 💾 Funciona 100% offline
- 📥 Exportação de dados

---

## 🛠️ Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna (Flexbox, Grid, Gradientes)
- **JavaScript ES6+** - Lógica da aplicação (Vanilla JS)
- **Chart.js** - Gráficos interativos
- **IndexedDB** - Banco de dados local
- **Service Workers** - Funcionalidade offline
- **Cache API** - Armazenamento de assets
- **Web App Manifest** - Configuração PWA
- **Google Fonts (Montserrat)** - Tipografia

---

## 📦 Instalação

### Pré-requisitos
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Servidor local (Live Server, etc)

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/paulomatheus/monyze.git
cd monyze
```

2. **Inicie um servidor local**

**Opção 1: Live Server (VS Code)**
- Instale a extensão "Live Server"
- Clique direito em `index.html` → "Open with Live Server"

**Opção 2: Node.js**
```bash
npx serve
```

3. **Acesse no navegador**
```
http://localhost:8000
```

4. **Instale como PWA**
- Desktop: Clique no ícone de instalação na barra de endereço
- Mobile: Menu → "Adicionar à tela inicial"

---

## 🚀 Como Usar

### Adicionar Transação
1. Clique no botão "+" na barra inferior OU no botão "Nova Transação"
2. Selecione o tipo (Receita ou Despesa)
3. Preencha descrição, valor, categoria e data
4. Clique em "Salvar"

### Editar Transação
1. Localize a transação no histórico
2. Clique no ícone ✏️
3. Modifique os campos desejados
4. Clique em "Atualizar"

### Exportar Dados
1. **Relatórios**: Exporta transações do período selecionado
2. **Configurações**: Exporta TODAS as transações

### Ativar Modo Escuro
1. Vá em Configurações
2. Ative o toggle "Tema Escuro"
3. A preferência é salva automaticamente

---

## 📂 Estrutura do Projeto
```
monyze/
│
├── index.html              # Página principal
├── manifest.json           # Configuração PWA
├── service-worker.js       # Service Worker (cache e offline)
├── README.md              # Informações gerais
│
├── css/
│   └── style.css          # Estilos globais
│
├── js/
│   ├── app.js             # Lógica principal
│   └── db.js              # Gerenciador IndexedDB
│
└── images/
    ├── icon-128.png       # Ícone 128x128
    └── icon-512.png       # Ícone 512x512
```

---

## ✅ Requisitos do Projeto

### Requisitos FEitos

| Requisito | Status | Detalhes |
|-----------|--------|----------|
| Controle de versão (Git/GitHub) | ✅ | Commits desde o início |
| Implantação (GitHub Pages) | ✅ | URL pública acessível |
| HTML5 Cache API | ✅ | Service Worker implementado |
| IndexedDB | ✅ | CRUD completo |
| Funcionamento offline | ✅ | 100% funcional sem internet |
| PWA instalável | ✅ | Manifest.json configurado |

### CRUD no IndexedDB

- **Create**: Adicionar novas transações
- **Read**: Listar todas as transações
- **Update**: Editar transações existentes
- **Delete**: Remover transações

### Funcionalidades Offline

Após a primeira visita e instalação:
- ✅ Navegação entre páginas
- ✅ Visualização de dados
- ✅ Adicionar/editar/deletar transações
- ✅ Gráficos e relatórios
- ✅ Exportação de dados
- ✅ Mudança de tema

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Paulo Matheus de Araujo Silva**
- GitHub: [@paulomatheus](https://github.com/paulomatheus)
- LinkedIn: [Paulo Matheus](https://www.linkedin.com/in/paulomatheus/)

---