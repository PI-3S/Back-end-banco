# Rotas - dashboard.js

## Descrição

Rotas para obtenção de métricas e dados de dashboard.

## Endpoints

### GET /api/dashboard/coordenador

**Propósito:** Obter métricas do dashboard para coordenadores.

**Permissões:** `coordenador`, `super_admin`

**Comportamento por Perfil:**
- **super_admin**: Vê dados de TODOS os cursos
- **coordenador**: Vê apenas dados dos cursos que coordena

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "metricas": {
    "total_submissoes": 150,
    "pendentes": 25,
    "aprovadas": 100,
    "reprovadas": 25,
    "por_area": [
      {
        "area": "Palestras",
        "total": 50,
        "aprovadas": 40,
        "pendentes": 5,
        "reprovadas": 5
      },
      {
        "area": "Cursos",
        "total": 100,
        "aprovadas": 60,
        "pendentes": 20,
        "reprovadas": 20
      }
    ],
    "por_curso": [
      {
        "curso": "Técnico em Informática",
        "total": 100,
        "aprovadas": 70,
        "pendentes": 15,
        "reprovadas": 15
      }
    ]
  }
}
```

**Observações:**
- Se não houver cursos, retorna métricas zeradas
- Se não houver regras, retorna métricas zeradas
- Agrupa submissões por área e por curso

---

### GET /api/dashboard/aluno

**Propósito:** Obter métricas do dashboard para alunos.

**Permissões:** `aluno`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "metricas": {
    "total_submissoes": 10,
    "pendentes": 2,
    "aprovadas": 7,
    "reprovadas": 1,
    "total_horas_aprovadas": 45,
    "carga_horaria_minima": 100,
    "progresso_percentual": 45,
    "horas_por_area": [
      {
        "area": "Palestras",
        "horas": 20,
        "limite": 20
      },
      {
        "area": "Cursos",
        "horas": 25,
        "limite": 40
      }
    ]
  }
}
```

**Observações:**
- Calcula total de horas aprovadas
- Calcula progresso percentual em relação à carga horária mínima do curso
- Agrupa horas por área (apenas aprovadas)
- Inclui limite de horas por área