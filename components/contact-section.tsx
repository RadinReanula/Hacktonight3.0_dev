'use client'

import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'

const contactDetails = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@novabank.com'
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (800) 555-0199'
  },
  {
    icon: MapPin,
    label: 'Head office',
    value: '100 Financial Plaza, New York, NY 10004'
  },
  {
    icon: Clock,
    label: 'Support hours',
    value: 'Mon–Fri, 8:00 AM – 8:00 PM EST'
  }
]

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section
      id="contact"
      className="border-border/60 border-t bg-card/40 px-6 py-20 sm:px-10"
    >
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <span className="font-semibold text-primary text-sm uppercase tracking-wide">
            Contact us
          </span>
          <h2 className="mt-3 text-balance font-bold text-3xl tracking-tight sm:text-4xl">
            We are here to help
          </h2>
          <p className="mt-4 text-muted-foreground">
            Have a question about your account or our services? Reach out and
            our support team will get back to you.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <ul className="flex flex-col gap-5">
            {contactDetails.map((detail) => {
              const Icon = detail.icon
              return (
                <li key={detail.label} className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium text-sm">{detail.label}</p>
                    <p className="text-muted-foreground text-sm">
                      {detail.value}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                <h3 className="font-semibold text-xl">Thank you</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  Your message has been received. Our team will be in touch
                  soon.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-name"
                      className="font-medium text-sm"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="contact-email"
                      className="font-medium text-sm"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="font-medium text-sm"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full sm:w-auto"
                >
                  Send message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
