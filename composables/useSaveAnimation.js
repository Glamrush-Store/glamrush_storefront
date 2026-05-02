export function useSaveAnimation() {
  const animationType = useState('saveAnimationType', () => null)

  function trigger(type) {
    animationType.value = type
    const duration = type === 'failed' ? 1600 : 900
    setTimeout(() => { animationType.value = null }, duration)
  }

  return { animationType, trigger }
}
