import { memo } from 'react'
import ReactMarkdown from 'react-markdown'

const linkTarget = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
}

function Message({ message }) {
  if (message.role === 'user') {
    return <div className="msg-user">{message.content}</div>
  }

  const waiting = message.streaming && !message.content
  return (
    <div className="msg-assistant" aria-live={message.streaming ? 'polite' : undefined}>
      <div className="mark" aria-hidden="true" />
      <div className={`body${message.streaming && message.content ? ' caret' : ''}`}>
        <span className="visually-hidden">Lantern said:</span>
        {waiting ? (
          <span className="typing" aria-label="Lantern is writing">
            <span /><span /><span />
          </span>
        ) : (
          <ReactMarkdown components={linkTarget} skipHtml>
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

export default memo(Message)
