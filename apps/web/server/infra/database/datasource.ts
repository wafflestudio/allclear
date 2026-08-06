import { DataSource } from 'typeorm'
import 'reflect-metadata'

import { MAIN_DATA_SOURCE_OPTIONS } from './datasource.config'
import Holder from 'src/lib/Holder'

export const connectionHolder = new Holder()

let dataSource: DataSource | undefined

export const getDataSource = () => {
  if (!dataSource) {
    dataSource = new DataSource(MAIN_DATA_SOURCE_OPTIONS)
    dataSource.initialize().then(() => {
      connectionHolder.resolve()
    })
  }
  return dataSource
}
