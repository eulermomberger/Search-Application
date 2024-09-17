import {
  exportRepositoriesToJson,
  filterRepositoriesByDescription,
  getRepositoriesFromGithub,
} from './utils';
import { Repository } from './types/Repository';

export const searchRepositories = async () => {
  const baseQuery = 'is:public stars:>=100 created:>=2024-01-01 size:>=1000';
  // Separar as queries por linguagem
  const queries = [
    `language:JavaScript ${baseQuery}`,
    `language:TypeScript ${baseQuery}`,
  ];

  const repositoriesByLanguage: { [key: string]: Repository[] } = {
    JavaScript: [],
    TypeScript: [],
  };

  try {
    for (const query of queries) {

      const repositories: Repository[] = await getRepositoriesFromGithub(query);

      // Filtrar os repositórios pela relevância da descrição
      const filteredRepositories = await filterRepositoriesByDescription(repositories);

      // Adicionar os repositórios ao grupo correto por linguagem
      filteredRepositories.forEach((repo) => {
        if (repo.language && repositoriesByLanguage[repo.language]) {
          repositoriesByLanguage[repo.language].push({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            html_url: repo.html_url,
            stargazers_count: repo.stargazers_count,
            language: repo.language,
            size: repo.size,
            created_at: repo.created_at,
          });
        }
      });
    }

    // Escrever o resultado em um arquivo JSON
    exportRepositoriesToJson(repositoriesByLanguage);
  } catch (error) {
    console.error('Erro ao buscar repositórios: ', error);
  }
};
