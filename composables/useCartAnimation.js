export function useCartAnimation() {
  const bumping = useState('cartBumping', () => false)

  function bump() {
    bumping.value = false
    nextTick(() => {
      bumping.value = true
      setTimeout(() => { bumping.value = false }, 500)
    })
  }

  return { bumping, bump }
}
