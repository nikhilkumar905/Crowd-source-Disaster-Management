const tones = {
  red: 'bg-[rgb(var(--signal))]/15 text-[rgb(var(--signal))]',
  blue: 'bg-[rgb(var(--info))]/15 text-[rgb(var(--info))]',
  green: 'bg-[rgb(var(--success))]/15 text-[rgb(var(--success))]',
  gray: 'bg-[rgb(var(--panel-strong))]/10 text-[rgb(var(--ink))]',
};

const Badge = ({ children, color = 'gray', className = '', ...props }) => {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[color] || tones.gray} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
