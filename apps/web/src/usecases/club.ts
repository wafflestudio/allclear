import { Club } from 'src/entities/club'
import {
  ClubRepository,
  GetManageClubRequest,
  UpdateManageClubImageRequest,
  UpdateManageClubRequest,
} from 'src/repositories/club'

export type ClubService = {
  updateManageClub: (
    clubReq: UpdateManageClubRequest,
    imageReq?: UpdateManageClubImageRequest,
  ) => Promise<void>
  getManageClub: (req: GetManageClubRequest) => Promise<Club>
}

type Deps = {
  repositories: [ClubRepository]
}

export const getClubService = ({ repositories }: Deps): ClubService => ({
  updateManageClub: async (clubReq, imageReq) => {
    await repositories[0].updateManageClub(clubReq)
    if (imageReq) {
      await repositories[0].updateManageClubImage(imageReq)
    }
  },
  getManageClub: (req) => repositories[0].getManageClub(req),
})
