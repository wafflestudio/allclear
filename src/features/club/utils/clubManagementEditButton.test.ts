import { getClubManagementEditButtonColors } from './clubManagementEditButton'

describe('club management edit button colors', () => {
	it('uses the default Figma colors when idle', () => {
		expect(getClubManagementEditButtonColors({ hovered: false, pressed: false })).toEqual({
			backgroundColor: '#EAEAEA',
			iconColor: '#874FFF',
		})
	})

	it('uses the selected colors when hovered', () => {
		expect(getClubManagementEditButtonColors({ hovered: true, pressed: false })).toEqual({
			backgroundColor: '#874FFF',
			iconColor: '#FFFFFF',
		})
	})

	it('uses the push colors while pressed even when hovered', () => {
		expect(getClubManagementEditButtonColors({ hovered: true, pressed: true })).toEqual({
			backgroundColor: '#4F2E94',
			iconColor: '#FFFFFF',
		})
	})
})
