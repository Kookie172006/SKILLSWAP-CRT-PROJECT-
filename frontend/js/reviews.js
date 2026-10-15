const API_BASE_URL = "https://skillswap-crt-project.onrender.com";
const token = localStorage.getItem("skillswap-token");

const urlParams = new URLSearchParams(window.location.search);
const urlSessionId = urlParams.get("sessionId");

const reviewForm = document.getElementById("reviewForm");
const ratingStars = document.querySelectorAll(".rating-star");
const reviewCommentInput = document.getElementById("reviewComment");
const reviewMessage = document.getElementById("reviewMessage");
const reviewsList = document.getElementById("reviewsList");
const emptyReviews = document.getElementById("emptyReviews");
const reviewFilter = document.getElementById("reviewFilter");
const ratingHint = document.getElementById("ratingHint");

let currentRating = 0;
let allReviews = [];

ratingStars.forEach(star => {
    star.addEventListener("click", () => {
        currentRating = Number(star.dataset.rating);

        ratingStars.forEach(item => {
            const selected =
                Number(item.dataset.rating) <= currentRating;

            item.classList.toggle("active", selected);
            item.classList.toggle("selected", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

        if (ratingHint) {
            ratingHint.style.color = "var(--muted)";
            ratingHint.textContent =
                `${currentRating} star${currentRating === 1 ? "" : "s"} selected`;
        }
    });
});

function showFeedback(message, isError = false) {
    if (!reviewMessage) return;

    reviewMessage.textContent = message;
    reviewMessage.style.color = isError ? "#d94848" : "var(--primary)";
}

function updateStats() {
    const totalElement = document.getElementById("totalReviews");
    const averageElement = document.getElementById("averageRating");
    const starsElement = document.getElementById("averageStars");

    const total = allReviews.length;

    const average = total
        ? allReviews.reduce((sum, review) => sum + Number(review.rating), 0) / total
        : 0;

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (averageElement) {
        averageElement.textContent = average.toFixed(1);
    }

    if (starsElement) {
        const rounded = Math.round(average);
        starsElement.textContent =
            "★".repeat(rounded) + "☆".repeat(5 - rounded);
    }
}

function renderReviews() {
    if (!reviewsList || !reviewFilter) return;

    reviewsList.replaceChildren();

    const filter = reviewFilter.value;

    const filteredReviews = allReviews.filter(review => {
        return filter === "All" ||
            Number(review.rating) === Number(filter);
    });

    if (emptyReviews) {
        emptyReviews.hidden = filteredReviews.length !== 0;
    }

    filteredReviews.forEach(review => {
        const card = document.createElement("article");
        card.className = "review-card";

        const header = document.createElement("div");
        header.className = "review-header";

        const info = document.createElement("div");

        const name = document.createElement("h3");
        name.className = "reviewer-name";
        name.textContent =
            review.reviewerName ||
            review.reviewer?.name ||
            "Community Member";

        const skill = document.createElement("p");
        skill.textContent = review.skillName
            ? `Skill session: ${review.skillName}`
            : "SkillSwap session";

        info.append(name, skill);

        const rating = document.createElement("span");
        rating.className = "review-rating";
        rating.setAttribute(
            "aria-label",
            `${review.rating} out of 5 stars`
        );
        rating.textContent =
            "★".repeat(Number(review.rating)) +
            "☆".repeat(5 - Number(review.rating));

        header.append(info, rating);
        card.appendChild(header);

        if (review.comment) {
            const comment = document.createElement("p");
            comment.className = "review-text";
            comment.textContent = review.comment;
            card.appendChild(comment);
        }

        const date = document.createElement("span");
        date.className = "review-date";

        const dateValue = review.createdAt || review.date;
        const parsedDate = dateValue ? new Date(dateValue) : null;

        date.textContent =
            parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                })
                : "Date unavailable";

        card.appendChild(date);
        reviewsList.appendChild(card);
    });

    updateStats();
}

async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not load reviews.");
        }

        allReviews = Array.isArray(data.reviews) ? data.reviews : [];
        renderReviews();
    } catch (error) {
        console.error("Error loading reviews:", error);

        if (emptyReviews) {
            emptyReviews.hidden = false;
        }
    }
}

reviewFilter?.addEventListener("change", renderReviews);

reviewForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (!token) {
        showFeedback("Please log in to submit a review.", true);
        return;
    }

    if (!urlSessionId) {
        showFeedback(
            "Please open the review form from a completed session.",
            true
        );
        return;
    }

    if (currentRating < 1 || currentRating > 5) {
        showFeedback("Please select a star rating.", true);

        if (ratingHint) {
            ratingHint.style.color = "#d94848";
        }

        return;
    }

    const payload = {
        sessionId: urlSessionId,
        rating: currentRating,
        comment: reviewCommentInput
            ? reviewCommentInput.value.trim()
            : ""
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to submit review.");
        }

        showFeedback("Review submitted successfully. Thank you!");

        reviewForm.reset();
        currentRating = 0;

        ratingStars.forEach(star => {
            star.classList.remove("active", "selected");
            star.setAttribute("aria-pressed", "false");
        });

        if (ratingHint) {
            ratingHint.textContent = "Select a star rating";
            ratingHint.style.color = "var(--muted)";
        }

        await loadReviews();
    } catch (error) {
        showFeedback(error.message || "Network error. Please try again.", true);
    }
});

loadReviews();
