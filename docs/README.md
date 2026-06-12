# Documentação — SGC SENAC Backend

Sistema de Gestão de Certificados (SGC) do SENAC. Gerencia o ciclo completo de atividades complementares curriculares: submissão por alunos → avaliação por coordenadores → cálculo de carga horária.

---

## Documentos

| Arquivo | Conteúdo |
| ------- | -------- |
| [ARQUITETURA.md](./ARQUITETURA.md) | Arquitetura em camadas, padrões de projeto, modelagem de dados, decisões técnicas |
| [DOCUMENTACAO-TECNICA-BACKEND.md](./DOCUMENTACAO-TECNICA-BACKEND.md) | Referência completa de endpoints, regras de negócio, coleções Firestore, variáveis de ambiente |
| [REUSO-QUALIDADE.md](./REUSO-QUALIDADE.md) | Reuso de componentes, qualidade do código, gestão de configuração |
| [api-exemplos-frontend.md](./api-exemplos-frontend.md) | Guia de integração para o frontend: serviços, composables, fluxos |

---

## Endpoints Resumidos

| Método | Rota | Perfil |
| ------ | ---- | ------ |
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/forgot-password` | Público |
| POST/GET/PATCH/DELETE | `/api/usuarios` | super_admin, coordenador |
| POST/GET/PATCH/DELETE | `/api/cursos` | super_admin |
| POST/GET/PATCH/DELETE | `/api/regras` | super_admin |
| POST/GET/PATCH/DELETE | `/api/submissoes` | Vários |
| POST/GET | `/api/certificados` | aluno |
| GET | `/api/dashboard/coordenador` | coordenador, super_admin |
| GET | `/api/dashboard/aluno` | aluno |
| GET/POST | `/api/configuracoes/:id` | super_admin |
| POST/GET/DELETE | `/api/coordenadores-cursos` | super_admin |
| POST/GET/DELETE | `/api/alunos-cursos` | coordenador, super_admin |

Detalhes completos → [DOCUMENTACAO-TECNICA-BACKEND.md](./DOCUMENTACAO-TECNICA-BACKEND.md)

---

## Perfis de Usuário

| Perfil | Capacidades |
| ------ | ----------- |
| `super_admin` | Acesso total: cursos, regras, todos os usuários, configurações |
| `coordenador` | Gerencia alunos do seu curso, avalia submissões, vê dashboard |
| `aluno` | Envia atividades, faz upload de certificados, acompanha progresso |

---

## Como Executar

```bash
cd functions
npm install
npm run dev    # porta 3000 com hot reload
```

Deploy em produção → [ARQUITETURA.md](./ARQUITETURA.md)
