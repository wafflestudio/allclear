type Props = {
  color?: string
  /** RN ActivityIndicator: small 20 / large 36 */
  size?: number
}

// 앱 ActivityIndicator 대응 (버튼 내부 로딩 표시)
export function Spinner({ color = '#874FFF', size = 20 }: Props) {
  return (
    <span
      role="status"
      aria-label="로딩 중"
      className="inline-block animate-spin rounded-full border-2 border-solid"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderRightColor: 'transparent',
      }}
    />
  )
}
