import React from 'react'

type University = {
  id: number
  name: string
}

type StudentClass = {
  id: number
  class: string
}

const universities: University[] = [
  { id: 1, name: '고려대학교' },
  { id: 2, name: '서울대학교' },
  { id: 3, name: '연세대학교' },
]

const studentClasses: StudentClass[] = [
  { id: 1, class: '10' },
  { id: 2, class: '11' },
  { id: 3, class: '12' },
  { id: 4, class: '13' },
  { id: 5, class: '14' },
  { id: 6, class: '15' },
  { id: 7, class: '16' },
  { id: 8, class: '17' },
  { id: 9, class: '18' },
  { id: 10, class: '19' },
  { id: 11, class: '20' },
  { id: 12, class: '21' },
  { id: 13, class: '22' },
]

type Props = {
  university: string
  setUniversity: (university: string) => void
  studentClass: string
  setStudentClass: (studentClass: string) => void
}

const SchoolInput: React.FC<Props> = ({
  university,
  setUniversity,
  studentClass,
  setStudentClass,
}) => {
  return (
    <div className={'w-full'}>
      <label
        htmlFor="school_input_group"
        className="text-md mb-1 block font-light text-black dark:text-gray-400"
      >
        학교/학번
      </label>
      <div id={'school_input_group'} className={'flex justify-between'}>
        <select
          defaultValue={''}
          value={university}
          className="text-md w-[42%] max-w-[200px] appearance-none border-0 border-b !border-green-600 bg-transparent px-0 text-center text-gray-700 focus:outline-none focus:ring-0 dark:border-gray-700 dark:text-gray-400"
          onChange={(e) => setUniversity(e.target.value)}
        >
          <option value="">학교</option>
          {universities
            .sort((a, b) => a.id - b.id)
            .map((university) => (
              <option key={university.id} value={university.name}>
                {university.name}
              </option>
            ))}
        </select>
        <select
          defaultValue={''}
          value={studentClass}
          className="text-md w-[42%] max-w-[200px] appearance-none border-0 border-b !border-green-600 bg-transparent px-0 text-center text-gray-700 focus:outline-none focus:ring-0 dark:border-gray-700 dark:text-gray-400"
          onChange={(e) => setStudentClass(e.target.value)}
        >
          <option value="">학번</option>
          {studentClasses
            .sort((a, b) => (a.class < b.class ? 1 : a.class > b.class ? -1 : 0))
            .map((studentClass) => (
              <option key={studentClass.id} value={studentClass.class}>
                {studentClass.class}학번
              </option>
            ))}
        </select>
      </div>
    </div>
  )
}
export default SchoolInput
