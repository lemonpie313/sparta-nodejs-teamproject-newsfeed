export const createCards = async (artists) => {
  const cardList = document.querySelector('.movieCards');
  cardList.innerHTML = movies
    .map(
      (movie) => `
          <section class="movie-card" id="${movie.id}">
              <img class="movie-img" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
              <h3 class="movie-title">${movie.title}</h3>
              <p class="movie-rating">평점 : ${movie.vote_average}</p>
          </section>`
    )
    .join('');
  cardList.addEventListener('click', clickCard);

  function clickCard() {
    document.querySelectorAll('.card-btn').forEach((card) => {
      card.addEventListener('click', function () {
        const artist = card.id.substr(9);
        alert(`완료: ${artist}`);
      });
    });
  }
};
