import { PropsWithChildren } from 'react'
export default function Container({ children }: PropsWithChildren) {
  return <div className="container-grid">{children}</div>
}
