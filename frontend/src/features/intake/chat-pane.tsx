import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { SendIcon } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/button/button";
import Card from "@/components/ui/card/card";
import Form from "@/components/ui/form/form";
import { looksSensitive } from "@/features/intake/sensitive-data";
import type { IChatMessage } from "@/schemas/intake-schema";
import styles from "@/features/intake/styles.module.css";

export const MAX_MESSAGE_LENGTH = 1000;

export interface ITurnError {
  message: string;
  canRetry: boolean;
}

interface Props {
  messages: IChatMessage[];
  /** The message being sent, shown until the reply arrives or the send fails. */
  pendingText: string | null;
  isWaiting: boolean;
  error: ITurnError | null;
  onRetry: () => void;
  onSend: (text: string) => void;
  onStartNew: () => void;
  /** Replaces the message input, e.g. with the summary panel. */
  footer?: ReactNode;
}

export default function ChatPane({
  messages,
  pendingText,
  isWaiting,
  error,
  onRetry,
  onSend,
  onStartNew,
  footer,
}: Props) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, pendingText, isWaiting, error]);

  return (
    <Card as="section" className={styles.chat} aria-label="Chat">
      <ol ref={listRef} className={styles.messages} aria-live="polite" aria-busy={isWaiting}>
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {pendingText !== null && <MessageBubble message={{ role: "user", content: pendingText }} />}
        {isWaiting && (
          <li className={styles.typing} role="status">
            Assistant is typing…
          </li>
        )}
        {error && (
          <li className={styles.turnError} role="alert">
            {error.message}
            {error.canRetry ? (
              <Button variant="secondary" onClick={onRetry}>
                Retry
              </Button>
            ) : (
              <Button variant="secondary" onClick={onStartNew}>
                Start new intake
              </Button>
            )}
          </li>
        )}
      </ol>
      {footer ?? <MessageInput disabled={isWaiting || pendingText !== null} onSend={onSend} />}
    </Card>
  );
}

function MessageBubble({ message }: { message: IChatMessage }) {
  return (
    <li className={clsx(styles.message, message.role === "user" ? styles.userMessage : styles.botMessage)}>
      <span className="sr-only">{message.role === "user" ? "You:" : "Assistant:"}</span>
      {message.content}
    </li>
  );
}

function MessageInput({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const showSensitiveWarning = looksSensitive(text);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <Form className={styles.inputForm} onSubmit={handleSubmit}>
      <Form.Field
        controlId="chat-message"
        className={styles.inputField}
        hint={showSensitiveWarning ? "This looks like a card or ID number. Please don't share real personal data." : undefined}
      >
        <Form.Label className="sr-only">Message</Form.Label>
        <Form.Input
          autoComplete="off"
          disabled={disabled}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Type your message"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Form.Field>
      <Button type="submit" variant="primary" size="icon" aria-label="Send" disabled={disabled || !text.trim()}>
        <SendIcon aria-hidden="true" />
      </Button>
    </Form>
  );
}
