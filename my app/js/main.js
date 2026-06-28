(function () {
  "use strict";

  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  var navBackdrop = document.querySelector(".nav-backdrop");

  if (burger && nav) {
    function closeMenu() {
      burger.classList.remove("burger--open");
      nav.classList.remove("nav--open");
      if (navBackdrop) {
        navBackdrop.classList.remove("nav-backdrop--visible");
      }
      document.body.classList.remove("menu-open");
    }

    burger.addEventListener("click", function () {
      burger.classList.toggle("burger--open");
      nav.classList.toggle("nav--open");
      if (navBackdrop) {
        navBackdrop.classList.toggle("nav-backdrop--visible");
      }
      document.body.classList.toggle("menu-open", nav.classList.contains("nav--open"));
    });

    nav.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu();
      });
    });

    if (navBackdrop) {
      navBackdrop.addEventListener("click", closeMenu);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("nav__link--active");
    }
  });

  var form = document.getElementById("booking-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = document.querySelector(".form__success");
      if (success) {
        success.classList.add("form__success--visible");
        form.reset();
        setTimeout(function () {
          success.classList.remove("form__success--visible");
        }, 5000);
      }
    });
  }

  var reviewForm = document.getElementById("review-form");
  var ratingInput = document.getElementById("review-rating");
  var ratingHint = document.getElementById("rating-hint");
  var starButtons = document.querySelectorAll(".star-btn");
  var reviewsList = document.getElementById("reviews-list");
  var reviewsScore = document.getElementById("reviews-score");
  var reviewsStars = document.getElementById("reviews-stars");
  var reviewsCount = document.getElementById("reviews-count");
  var reviewsStorageKey = "code-tutor-reviews";

  function getStoredReviews() {
    try {
      return JSON.parse(localStorage.getItem(reviewsStorageKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveReviews(reviews) {
    localStorage.setItem(reviewsStorageKey, JSON.stringify(reviews));
  }

  function submitNetlifyForm(form) {
    if (window.location.protocol === "file:") {
      return Promise.resolve();
    }

    var formData = new FormData(form);
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    });
  }

  function createStars(rating) {
    var value = Number(rating) || 0;
    return "★★★★★".slice(0, value) + "☆☆☆☆☆".slice(0, 5 - value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderReviews() {
    if (!reviewsList) {
      return;
    }

    var reviews = getStoredReviews();

    if (!reviews.length) {
      reviewsList.innerHTML = '<div class="empty-reviews">Отзывы появятся здесь после отправки формы.</div>';
      if (reviewsScore) {
        reviewsScore.textContent = "0.0";
      }
      if (reviewsStars) {
        reviewsStars.textContent = "★★★★★";
      }
      if (reviewsCount) {
        reviewsCount.textContent = "Пока нет отзывов";
      }
      return;
    }

    var total = reviews.reduce(function (sum, review) {
      return sum + Number(review.rating);
    }, 0);
    var average = total / reviews.length;

    reviewsList.innerHTML = reviews.map(function (review) {
      return (
        '<article class="review-card">' +
        '<div class="review-card__top">' +
        "<div>" +
        '<p class="review-card__name">' + escapeHtml(review.name) + "</p>" +
        '<p class="review-card__course">' + escapeHtml(review.course) + "</p>" +
        "</div>" +
        '<div class="review-card__stars" aria-label="Оценка ' + escapeHtml(review.rating) + ' из 5">' + createStars(review.rating) + "</div>" +
        "</div>" +
        '<p class="review-card__text">' + escapeHtml(review.comment) + "</p>" +
        "</article>"
      );
    }).join("");

    if (reviewsScore) {
      reviewsScore.textContent = average.toFixed(1);
    }
    if (reviewsStars) {
      reviewsStars.textContent = createStars(Math.round(average));
    }
    if (reviewsCount) {
      reviewsCount.textContent = reviews.length + " отзыв" + (reviews.length === 1 ? "" : "ов");
    }
  }

  function setRating(value) {
    if (!ratingInput) {
      return;
    }

    if (!value) {
      ratingInput.value = "";
      starButtons.forEach(function (button) {
        button.classList.remove("is-active");
        button.setAttribute("aria-checked", "false");
      });
      if (ratingHint) {
        ratingHint.textContent = "Выберите оценку от 1 до 5";
      }
      return;
    }

    ratingInput.value = value;
    starButtons.forEach(function (button) {
      var isActive = Number(button.dataset.rating) <= Number(value);
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-checked", String(Number(button.dataset.rating) === Number(value)));
    });

    if (ratingHint) {
      ratingHint.textContent = value + " из 5";
    }
  }

  if (starButtons.length) {
    starButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setRating(button.dataset.rating);
      });
    });
  }

  if (reviewForm) {
    renderReviews();

    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!ratingInput.value) {
        if (ratingHint) {
          ratingHint.textContent = "Сначала выберите оценку";
        }
        return;
      }

      var reviews = getStoredReviews();
      var review = {
        name: reviewForm.elements.name.value.trim(),
        course: reviewForm.elements.course.value,
        rating: ratingInput.value,
        comment: reviewForm.elements.comment.value.trim()
      };

      reviews.unshift({
        name: review.name,
        course: review.course,
        rating: review.rating,
        comment: review.comment
      });
      saveReviews(reviews);
      renderReviews();

      var reviewSuccess = document.getElementById("review-success");
      submitNetlifyForm(reviewForm).finally(function () {
        reviewForm.reset();
        setRating("");

        if (reviewSuccess) {
          reviewSuccess.classList.add("form__success--visible");
          setTimeout(function () {
            reviewSuccess.classList.remove("form__success--visible");
          }, 5000);
        }
      });
    });
  }

  var revealItems = document.querySelectorAll(".card, .info-block, .quick-nav__item, .trust-card, .review-panel, .step, .cta-banner");
  if ("IntersectionObserver" in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach(function (item) {
      item.classList.add("reveal");
      revealObserver.observe(item);
    });
  }
})();
