interface PageHeaderProps {
  heading: string
  subheading?: string
}

export function PageHeader({ heading, subheading }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
      {subheading && <p className="text-muted-foreground mt-1">{subheading}</p>}
    </div>
  )
}
