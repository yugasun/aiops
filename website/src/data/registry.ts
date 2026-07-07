import generated from './registry.generated.json'
import {
  agentMeta,
  sequenceTypeLabels,
  skillCategories,
  skillDescriptions,
  tier2Handoffs,
  virtualAgents,
  type LocaleText,
} from './registry.i18n'

export type { LocaleText }

export type Lang = 'en' | 'zh'

export function t(text: LocaleText, lang: Lang): string {
  return lang === 'zh' ? text.zh : text.en
}

function skillDesc(name: string, fallbackEn: string): LocaleText {
  return (
    skillDescriptions[name] ?? {
      en: fallbackEn,
      zh: fallbackEn,
    }
  )
}

export function buildSkillCategories() {
  const byCategory = new Map<string, typeof generated.skills>()

  for (const skill of generated.skills) {
    const list = byCategory.get(skill.category) ?? []
    list.push(skill)
    byCategory.set(skill.category, list)
  }

  return generated.categoryOrder
    .map((categoryId) => {
      const meta = skillCategories[categoryId]
      if (!meta) return null

      const order = (generated.skillOrder as Record<string, string[]>)[categoryId] ?? []
      const skillsInCat = byCategory.get(categoryId) ?? []
      const sorted = [...skillsInCat].sort(
        (a, b) => order.indexOf(a.name) - order.indexOf(b.name)
      )

      return {
        id: categoryId,
        icon: meta.icon,
        title: meta.title,
        desc: meta.desc,
        skills: sorted.map((s) => ({
          name: `/${s.name}`,
          alwaysOn: s.alwaysOn,
          desc: skillDesc(s.name, s.descriptionEn),
        })),
      }
    })
    .filter((cat): cat is NonNullable<typeof cat> => cat !== null)
}

export function buildTier2Skills() {
  return generated.tier2.map((name) => ({
    name,
    handoff:
      tier2Handoffs[name] ?? {
        en: 'See docs/skill-registry.md',
        zh: '见 docs/skill-registry.md',
      },
  }))
}

export function buildAgents() {
  return generated.agents.map((agent) => {
    const meta = agentMeta[agent.name]
    if (!meta) {
      return {
        id: agent.name,
        icon: '•',
        color: 'text-muted-foreground',
        role: { en: agent.role, zh: agent.role },
        desc: { en: agent.role, zh: agent.role },
        skills: agent.skills,
        outputs: agent.outputs,
      }
    }
    return {
      id: agent.name,
      icon: meta.icon,
      color: meta.color,
      role: meta.role,
      desc: meta.desc,
      skills: agent.skills,
      outputs: agent.outputs,
    }
  })
}

export function buildSequences() {
  return generated.sequences.map((seq) => ({
    type:
      sequenceTypeLabels[seq.taskType] ?? {
        en: seq.taskType,
        zh: seq.taskType,
      },
    agents: seq.agents,
  }))
}

export const artifacts = generated.artifacts

export function agentDisplay(agentId: string, agents: ReturnType<typeof buildAgents>) {
  const agent = agents.find((a) => a.id === agentId)
  if (agent) return { icon: agent.icon, id: agent.id }
  const virtual = virtualAgents[agentId]
  return { icon: virtual?.icon ?? '•', id: agentId }
}

export const registryVersion = generated.version
export const latestReleaseVersion =
  generated.latestReleaseVersion ?? generated.version
