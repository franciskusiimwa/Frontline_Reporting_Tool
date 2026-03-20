import { type TextareaHTMLAttributes } from 'react'

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const classes = `w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 ${props.className ?? ''}`.trim()
  return <textarea className={classes} {...props} />
}
