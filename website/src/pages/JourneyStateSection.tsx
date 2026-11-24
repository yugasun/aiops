import { useI18n } from '../lib/i18n'

export function JourneyStateSection() {
  const { t } = useI18n()

  const sessions = [
    ['journey.demo.input1', 'journey.demo.step1', 'journey.demo.desc1'],
    ['journey.demo.input2', 'journey.demo.step2', 'journey.demo.desc2'],
  ]

  return (
    <div className="journey-layout">
      <figure className="journey-record">
        <figcaption className="record-label">{t('journey.demo.title')}</figcaption>
        {sessions.map(([prompt, step, status]) => (
          <div className="journey-session" key={prompt}>
            <pre><code>{t(prompt)}</code></pre>
            <p>{t(step)}</p>
            <p>{t(status)}</p>
          </div>
        ))}
      </figure>
      <dl className="journey-notes">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <dt>{t(`journey.card.${i}.name`)}</dt>
            <dd>{t(`journey.card.${i}.desc`)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
