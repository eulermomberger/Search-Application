import axios from 'axios';
import dotenv from 'dotenv';
import lda from '@stdlib/nlp-lda';
import * as fs from 'fs';

import { Repository } from './types/Repository';

dotenv.config();

export const filterRepositoriesByDescription = async (repositories: Repository[]) => {
  const forbiddenKeys = ['plugin', 'module', 'extension', 'database', 'framework', 'library'];

  return repositories.filter((repository) => {
    const { description } = repository;

    if (!description) return false;

    const descriptionDoc = description.match(/[^\.!\?]+[\.!\?]+/g); // Divide a descrição em frases

    if (!descriptionDoc) return false;

    // Tokeniza as frases e remove pontuações
    const documents = descriptionDoc.map((sentence) => (
      sentence.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    ));

    // Aplica LDA para extrair 2 tópicos
    const ldaResult = lda(documents, 2);
    ldaResult.fit(1000, 100, 10);

    const terms = Array.from({ length: 2 }).flatMap((_, i) => (
      ldaResult.getTerms(i, 5).flatMap((term) => term.word)
    ));

    const isInvalidRepository = terms.some((term) => forbiddenKeys.includes(term.toLowerCase()));

    return !isInvalidRepository;
  });
};

export const getRepositoriesFromGithub = async (query: string) => {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc`;

  const repositories: Repository[] = [];
  let totalOfRepositories = 0;
  let currentPage = 1;

  do {
    const response = await axios.get(`${url}&per_page=50&page=${currentPage}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      }
    });

    const { items, total_count: totalCount } = response.data;

    repositories.push(...items);
    totalOfRepositories = totalCount;
    currentPage += 1;
  } while (repositories.length < totalOfRepositories);

  return repositories;
};

export const exportRepositoriesToJson = (repositories: { [key: string]: Repository[] }) => {
  fs.writeFileSync('output/repositories.json', JSON.stringify(repositories, null, 2));
  console.log('Repositórios salvos no arquivo repositories.json na pasta output');
};
