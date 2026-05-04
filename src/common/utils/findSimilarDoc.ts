import { map, sum, zipWith } from 'lodash-es'

const tokenize = (document: string) => {
  return document.split(/\s+/g)
}

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = sum(zipWith(vecA, vecB, (a, b) => a! * b!))
  const magnitudeA = Math.sqrt(sum(map(vecA, (item) => item * item)))
  const magnitudeB = Math.sqrt(sum(map(vecB, (item) => item * item)))
  return dotProduct / (magnitudeA * magnitudeB)
}

const fit = (corpus: string[]) => {
  const uniqueWords = new Set<string>()
  corpus.forEach((document, index) => {
    tokenize(document).forEach((word) => {
      uniqueWords.add(word)
    })
  })
  return uniqueWords
}

const transform = (corpus: string[], uniqueWords: Set<string>) => {
  const wordCounts = new Map<string, Map<number, number>>()
  corpus.forEach((document, index) => {
    tokenize(document).forEach((word) => {
      if (!wordCounts.has(word)) {
        wordCounts.set(word, new Map())
      }
      const wordMap = wordCounts.get(word)!
      if (!wordMap.has(index)) {
        wordMap.set(index, 0)
      }
      wordMap.set(index, wordMap.get(index)! + 1)
    })
  })
  return wordCounts
}

const tfidf = (givenTokens: string[], documentTokens: string[][]): string[] => {
  return []
}

export const findSimilarDoc = (given: string, documents: string[], topN = 2) => {
  const givenTokens = tokenize(given)
  const documentTokens = documents.map((doc) => tokenize(doc))

  const corpus = [given, ...documents]
  const uniqueWords = fit(corpus)
  const wordCounts = transform(documents, uniqueWords)

  // Get TF-IDF vectors
  const targetVector: number[] = []
  const docVector: number[] = []

  // for (const term of terms) {
  //   targetVector.push(tfidf.tfidfs(term, documents.length))
  //   docVector.push(tfidf.tfidfs(term, index))
  // }
  //
  // Calculate and display the cosine similarity
  // const similarity = cosineSimilarity(targetVector, docVector)
  // console.log(`Similarity between target document and document ${index + 1}: ${similarity}`)
}
