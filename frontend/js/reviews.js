// =========================
// REVIEW DATA AND SETUP
// =========================

const reviewForm = document.getElementById("reviewForm");
const reviewsList = document.getElementById("reviewsList");
const reviewFilter = document.getElementById("reviewFilter");
const reviewMessage = document.getElementById("reviewMessage");
const ratingHint = document.getElementById("ratingHint");
const ratingButtons = document.querySelectorAll(".rating-star");

let selectedRating = 0;
let reviews = JSON.parse(
    localStorage.getItem("skillswap-reviews")
) || [];

// =========================
// STAR RATING PICKER
// =========================

const ratingDescriptions = {
    1: "1 star — Needs improvement",
    2: "2 stars — Fair experience",
    3: "3 stars — Good experience",
    4: "4 stars — Great experience",
    5: "5 stars — Excellent experience!"
};

function updateRatingPicker() {
    ratingButtons.forEach(button => {
        const rating = Number(button.dataset.rating);

        button.classList.toggle("selected", rating <= selectedRating);
        button.setAttribute(
            "aria-pressed",
            String(rating === selectedRating)
        );
    });

    ratingHint.textContent = selectedRating
        ? ratingDescriptions[selectedRating]
        : "Select a star rating";
}

ratingButtons.forEach(button => {
    button.addEventListener("click", function () {
        selectedRating = Number(this.dataset.rating);
        updateRatingPicker();
    });
});

// =========================
// SAVE REVIEWS
// =========================

function saveReviews() {
    localStorage.setItem("skillswap-reviews", JSON.stringify(reviews));
}

// =========================
// FORMAT DATES
// =========================

function formatReviewDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// =========================
// UPDATE REVIEW STATISTICS
// =========================

function updateReviewStats() {
    const total = reviews.length;

    const average = total
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
        : 0;

    document.getElementById("totalReviews").textContent = total;
    document.getElementById("averageRating").textContent = average.toFixed(1);

    const roundedRating = Math.round(average);

    document.getElementById("averageStars").textContent =
        "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
}

// =========================
// RENDER REVIEW CARDS
// =========================

function renderReviews() {
    reviewsList.innerHTML = "";

    const filter = reviewFilter.value;

    const filteredReviews = reviews
        .filter(review => filter === "All" ||
            review.rating === Number(filter))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById("emptyReviews").hidden =
        filteredReviews.length !== 0;

    filteredReviews.forEach(review => {
        const card = document.createElement("article");
        card.className = "review-card";

        const top = document.createElement("div");
        top.className = "review-card-top";

        const reviewerInfo = document.createElement("div");
        reviewerInfo.className = "reviewer-info";

        const avatar = document.createElement("span");
        avatar.className = "reviewer-avatar";
        avatar.textContent = review.partner.trim().charAt(0).toUpperCase();

        const info = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = review.partner;

        const skill = document.createElement("p");
        skill.textContent = `Skill session: ${review.skill}`;

        info.append(name, skill);
        reviewerInfo.append(avatar, info);

        const stars = document.createElement("span");
        stars.className = "review-rating";
        stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
        stars.textContent =
            "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

        top.append(reviewerInfo, stars);
        card.appendChild(top);

        if (review.comment) {
            const comment = document.createElement("p");
            comment.className = "review-comment";
            comment.textContent = review.comment;
            card.appendChild(comment);
        }

        const date = document.createElement("span");
        date.className = "review-date";
        date.textContent = formatReviewDate(review.date);

        card.appendChild(date);
        reviewsList.appendChild(card);
    });

    updateReviewStats();
}

// =========================
// SUBMIT A REVIEW
// =========================

reviewForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const partner = document.getElementById("reviewPartner").value.trim();
    const skill = document.getElementById("reviewSkill").value.trim();
    const comment = document.getElementById("reviewComment").value.trim();

    if (!partner || !skill) {
        showReviewMessage("Please enter your partner and the skill.", true);
        return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
        showReviewMessage("Please select a star rating first.", true);
        return;
    }

    // Demo-only duplicate check for the same partner and skill.
    const duplicate = reviews.some(review =>
        review.partner.toLowerCase() === partner.toLowerCase() &&
        review.skill.toLowerCase() === skill.toLowerCase()
    );

    if (duplicate) {
        showReviewMessage(
            "A review for this partner and skill already exists in this demo.",
            true
        );
        return;
    }

    const newReview = {
        id: Date.now().toString(),
        partner,
        skill,
        rating: selectedRating,
        comment,
        date: new Date().toISOString()
    };

    reviews.push(newReview);
    saveReviews();

    reviewForm.reset();
    selectedRating = 0;
    updateRatingPicker();

    reviewFilter.value = "All";
    showReviewMessage("Your review has been added! Thanks for sharing 💜", false);

    renderReviews();
});

// =========================
// FORM FEEDBACK
// =========================

function showReviewMessage(message, isError) {
    reviewMessage.textContent = message;
    reviewMessage.style.color = isError ? "#d94848" : "var(--primary)";
}

// =========================
// FILTER REVIEWS
// =========================

reviewFilter.addEventListener("change", renderReviews);

// =========================
// INITIAL PAGE RENDER
// =========================

updateRatingPicker();
renderReviews();

