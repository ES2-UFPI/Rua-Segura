# 🚨 Rua Segura - Release Notes v1.0.0 🛡️

Bem-vindo ao lançamento oficial da versão **v1.0.0** do **Rua Segura**! A sua ferramenta inteligente de segurança urbana projetada para ajudar você a navegar pela cidade com tranquilidade e tomar decisões mais seguras de deslocamento.

---

## 🚀 Resumo das Mudanças Mais Impactantes

Nesta primeira grande versão, nós entregamos a infraestrutura essencial e as principais ferramentas de segurança do **Rua Segura**:
* **Mapa de Risco Interativo:** Visualização em tempo real das condições de segurança de diferentes regiões.
* **Cálculo Dinâmico de Risco:** Atualização instantânea do nível de perigo com base na sua localização atual.
* **Acessibilidade Inovadora:** Modo adaptável para usuários **Destros e Canhotos**, reposicionando controles críticos na tela.
* **Alertas Inteligentes:** Notificações locais automáticas ao se aproximar de zonas de risco elevado.

---

## 🎯 Impacto para o Usuário – Por que isso importa?

A segurança pública afeta a vida de todos no espaço urbano. Com o **Rua Segura v1.0.0**, você deixa de caminhar às cegas:
1. **Evite áreas perigosas proativamente:** O app avisa antes que você entre em uma área de alto risco.
2. **Colaboração cidadã:** Registre e consulte problemas como falta de iluminação ou assaltos diretamente no mapa.
3. **Usabilidade rápida em situações críticas:** Seus botões de ação e emergência estão ao alcance fácil de um único polegar, independentemente de qual mão você usa para segurar o celular.

---

## 🛠️ Detalhamento das Modificações

### 🆕 News (Novidades)
* **📍 Mapa Principal com Georreferenciamento:** Implementado mapa interativo com suporte para pinos e sinalização visual de ocorrências próximas.
* **⚠️ Monitoramento Reativo de Risco via GPS:** O aplicativo se conecta à localização em segundo plano do dispositivo e recalcula instantaneamente o risco de segurança onde o usuário está pisando.
* **🆘 Botão de Emergência Integrado:** Adicionado um atalho flutuante de socorro na interface para acionamento rápido e estético de socorro.
* **✍️ Cadastro e Confirmação de Ocorrências:** Fluxo completo para selecionar um ponto no mapa, escolher a categoria (Ex: Iluminação ruim, Assalto) e confirmar os detalhes antes de enviar para o servidor.
* **♿ Suporte de Ergonomia Destro/Canhoto:** Interface dinâmica que permite inverter os lados do Botão de Emergência e do Indicador de Risco no mapa, facilitando o uso confortável com uma mão.
* **🔔 Notificações de Alerta na Tela:** Banner pop-up interativo que exibe informações urgentes e descritivas sobre áreas perigosas nas proximidades.

### 📈 Improvements (Melhorias)
* **📡 Algoritmo de Cálculo de Risco:** Backend em FastAPI otimizado para calcular notas e níveis de risco (AZUL, VERDE, AMARELO, VERMELHO) de forma rápida com base na proximidade espacial de ocorrências registradas.
* **🔋 Otimização de Localização Nativa:** Integração avançada com a API `expo-location` para rastreamento de alta precisão sem consumo excessivo de bateria.
* **🔄 Centralização Dinâmica do Mapa:** Ajuste inteligente que centraliza o mapa no usuário ao iniciar o aplicativo e permite recentralização manual a qualquer momento.
* **🎨 Visual Clean & Moderno:** Refinamento do design do frontend no padrão Dark Mode com feedbacks visuais nítidos e bordas arredondadas elegantes.

### 🐛 Bug Fixes (Correções de Bugs)
* **⚠️ Prevenção de Loops de Notificação:** Ajustada a lógica de controle de estado no frontend para evitar disparos repetitivos do mesmo alerta de risco ao movimentar-se na mesma área (Closes #79).
* **📐 Ajuste na Arquitetura do Risco:** Correção nas fórmulas matemáticas do backend para garantir que as distâncias de ocorrências passadas reflitam com precisão no cálculo de risco local (Closes #68).
* **🔗 Conexão e Dependências da API:** Ajuste de portas de rede e dependências internas que causavam erros de conexão HTTP entre o Expo (frontend) e a API FastAPI (backend) (Closes #61).

### ⚙️ Others (Outros)
* **🏗️ Setup de Repositório Automatizado:** Criação de tarefas (`tasks.json` do VS Code) para configurar dependências de Python/Virtualenv e NodeJS de forma automática.
* **📦 Organização Clean Code:** Migração de códigos e exemplos padrão de scaffold para a pasta `app-example`, mantendo a raiz do frontend limpa para o desenvolvimento.

---

## ⚠️ Limitações & Problemas Conhecidos (Em Desenvolvimento)

Estamos trabalhando ativamente para aprimorar o app. Fique atento às seguintes limitações desta versão:
* **Botão de Emergência Estético:** Nesta fase do desenvolvimento, o botão de emergência exibe apenas um feedback visual de acionamento. A integração com números de emergência (como 190) e envio de SMS para contatos de confiança será adicionada na próxima sprint.
* **Latência de Sinal de GPS:** Em ambientes fechados ou sob condições climáticas adversas, a atualização de risco baseada em GPS pode apresentar atrasos pontuais.
* **Persistência de Dados:** O backend está rodando com persistência baseada em arquivos/memória volátil. Um banco de dados robusto (PostgreSQL com PostGIS) está planejado para a próxima release de produção.

---

*Equipe Rua Segura - Engenharia de Software II (ES2-UFPI)*
