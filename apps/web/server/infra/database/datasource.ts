import { DataSource } from 'typeorm'
import 'reflect-metadata'

import Holder from 'src/lib/Holder'
import { MAIN_DATA_SOURCE_OPTIONS } from './datasource.config'

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
