import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import styles from '../../loading.module.scss';

export default function Loading() {
  return (
    <div className={styles.loading}>
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}
