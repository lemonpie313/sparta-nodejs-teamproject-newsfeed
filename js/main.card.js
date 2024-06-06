export const clickCards = async function () {
  function clickCard() {
    document.querySelectorAll('.card-btn').forEach((card) => {
      card.addEventListener('click', function () {
        const artist = card.id.substr(9);
        alert(`완료: ${artist}`);
      });
    });
  }
};
