const sweetAlertScript = document.createElement('script');
sweetAlertScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';

document.head.appendChild(sweetAlertScript);

function showSweetAlert (winner) {
	let winnerTeam, backgroundColor;

	if (winner === 'blue') {
		winnerTeam = 'Blue';
		backgroundColor = '#044C91';
	} else if (winner === 'red') {
		winnerTeam = 'Red';
		backgroundColor = '#8D153A';
	} else {
		winnerTeam = 'No one';
		backgroundColor = '#555555'; // gray for tie
	}

	const textColor = '#FFFFFF';

	if (typeof Swal === 'undefined') {
		console.error('SweetAlert2 not loaded yet. Falling back to basic alert.');
		alert(winner === 'tie' ? `It's a tie! Nobody wins!` : `Congratulations Team ${winnerTeam}! Your team winned!`);
		return;
	}

	const trophySvg = `
		<img src="res/img/trophy-star.png" width="100" height="100" style="filter: ${
			winner === 'blue' ? 'hue-rotate(200deg)' :
			winner === 'red' ? 'hue-rotate(0deg)' :
			'hue-rotate(90deg) saturate(0)' // grayish for tie
		}" />
	`;

	const titleText = winner === 'tie' ? `It's a tie!` : `Congratulations Team ${winnerTeam}!`;
	const subText = winner === 'tie' ? `Both teams gave it their all!` : `Your team winned!`;

	Swal.fire({
		title: titleText,
		html: `
			<div style="margin-bottom: 15px;">${trophySvg}</div>
			<p style="font-size: 24px; margin: 20px 0;">${subText}</p>
		`,
		icon: 'success',
		allowOutsideClick: false,
		background: '#fff',

		showClass: {
			popup: 'animate__animated animate__fadeInDown'
		},
		hideClass: {
			popup: 'animate__animated animate__fadeOutUp'
		},
		customClass: {
			title: `winner-title-${winner}`,
			confirmButton: `winner-button-${winner}`
		}
	}).then((result) => {
		if (result.isConfirmed) {
			resetGame();
		}
	});

	const style = document.createElement('style');
	style.textContent = `
		.winner-title-${winner} {
			color: ${backgroundColor} !important;
			font-size: 32px !important;
		}
		.winner-button-${winner} {
			background-color: ${backgroundColor} !important;
			color: ${textColor} !important;
		}
		.swal2-icon.swal2-success {
			border-color: ${backgroundColor} !important;
			color: ${backgroundColor} !important;
		}
		.swal2-icon.swal2-success [class^=swal2-success-line] {
			background-color: ${backgroundColor} !important;
		}
		.swal2-icon.swal2-success .swal2-success-ring {
			border-color: ${backgroundColor} !important;
		}
	`;
	document.head.appendChild(style);

	if (!document.querySelector('link[href*="animate.min.css"]')) {
		const animateCSS = document.createElement('link');
		animateCSS.rel = 'stylesheet';
		animateCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
		document.head.appendChild(animateCSS);
	}

	gameActive = false;
}
