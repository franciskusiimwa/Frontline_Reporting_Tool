import { type InputHTMLAttributes } from 'react'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const classes = `w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 ${props.className ?? ''}`.trim()
  return <input className={classes} {...props} />
}
