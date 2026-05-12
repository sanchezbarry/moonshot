'use client'

import React, { JSX, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

type Card = {
  id: string | number
  content: JSX.Element | React.ReactNode | string
  className: string
  thumbnail: string
  title?: string
}

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  const [selected, setSelected] = useState<Card | null>(null)
  const [lastSelected, setLastSelected] = useState<Card | null>(null)

  const handleClick = (card: Card) => {
    setLastSelected(selected)
    setSelected(card)
  }

  const handleOutsideClick = () => {
    setLastSelected(selected)
    setSelected(null)
  }

  return (
    <div className="w-full h-full p-10 grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-4 relative">
      {cards.map((card, i) => (
        <div key={i} className={cn(card.className, '')}>
          <motion.div
            onClick={() => handleClick(card)}
            className={cn(
              card.className,
              'relative overflow-hidden',
              selected?.id === card.id
                ? 'rounded-lg cursor-pointer absolute inset-0 h-1/2 w-full md:w-1/2 m-auto z-50 flex justify-center items-center flex-wrap flex-col'
                : lastSelected?.id === card.id
                ? 'z-40 bg-white rounded-xl h-full w-full'
                : 'bg-white rounded-xl h-full w-full'
            )}
            layoutId={`card-${card.id}`}
          >
            {selected?.id === card.id && <SelectedCard selected={selected} />}
            <ImageComponent card={card} />
          </motion.div>
        </div>
      ))}

      {/* Dim overlay behind the expanded card — click it to close */}
      <motion.div
        onClick={handleOutsideClick}
        className={cn(
          'absolute h-full w-full left-0 top-0 bg-black opacity-0 z-10',
          selected?.id ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        animate={{ opacity: selected?.id ? 0.3 : 0 }}
      />
    </div>
  )
}

const ImageComponent = ({ card }: { card: Card }) => {
  return (
    <div className="relative h-full w-full">
      <motion.img
        layoutId={`image-${card.id}-image`}
        src={card.thumbnail}
        height="500"
        width="500"
        className="object-cover object-top absolute inset-0 h-full w-full transition duration-200"
        alt="thumbnail"
      />
      {/* Title is always visible at the bottom of each card */}
      {card.title && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/70 via-black/30 to-transparent p-4 pt-8">
          <p className="text-white font-semibold text-lg leading-tight">{card.title}</p>
        </div>
      )}
    </div>
  )
}

const SelectedCard = ({ selected }: { selected: Card | null }) => {
  return (
    <div className="h-full w-full flex flex-col justify-end rounded-lg shadow-2xl relative z-60">
      {/* Uniform dark overlay across the whole image */}
      <div className="absolute inset-0 bg-black/60 rounded-lg" />
      <motion.div
        layoutId={`content-${selected?.id}`}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative px-8 pb-6 z-70"
      >
        {selected?.content}
      </motion.div>
    </div>
  )
}
