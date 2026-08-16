import { MdiIcon } from '../../../shared/components/icons'
import { getSnsIcon, getSnsIconSize } from '../../../shared/utils/clubSns'

type Props = {
  clubName: string
  snsUrls: string[]
}

/**
 * 앱 ClubDetailScreen 히어로 카드의 SNS 아이콘 행:
 * 30×30 원형(POINTCOLOR 10%) 버튼, 아이콘은 SNS 종류에 따라 16/18, gap 5, 위 여백 10.
 * 앱은 Linking.openURL → 웹은 새 탭 링크.
 */
export function SnsRow({ clubName, snsUrls }: Props) {
  if (snsUrls.length === 0) return null

  return (
    <div className="mt-2.5 flex gap-[5px]">
      {snsUrls.map((snsUrl, index) => (
        <a
          key={snsUrl}
          href={snsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${clubName} SNS ${index + 1} 열기`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[rgba(135,79,255,0.1)] text-[#874FFF] active:opacity-50"
        >
          <MdiIcon name={getSnsIcon(snsUrl)} size={getSnsIconSize(snsUrl)} />
        </a>
      ))}
    </div>
  )
}
