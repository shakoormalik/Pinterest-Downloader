export const createConfetti = () => {
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '1000';
  document.body.appendChild(confettiContainer);
  
  const colors = ['#E60023', '#FD0D55', '#0F8443', '#1DA1F2', '#FF9900'];
  
  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.position = 'absolute';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = -10 + 'px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = Math.random() * 10 + 5 + 'px';
    confetti.style.opacity = '0';
    confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
    confettiContainer.appendChild(confetti);
    
    // Animate confetti
    const animation = confetti.animate(
      [
        { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 },
        { transform: 'translate3d(' + (Math.random() * 400 - 200) + 'px, ' + (Math.random() * 600 + 600) + 'px, 0) rotate(' + Math.random() * 520 + 'deg)', opacity: 0 }
      ],
      {
        duration: Math.random() * 3000 + 2000,
        easing: 'cubic-bezier(0, .9, .57, 1)',
        delay: Math.random() * 1000
      }
    );
    
    animation.onfinish = function() {
      confetti.remove();
      if (confettiContainer.childElementCount === 0) {
        confettiContainer.remove();
      }
    };
  }
};
